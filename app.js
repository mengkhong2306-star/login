import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://ddkqqauzhzeqnrvjguxh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRka3FxYXV6aHplcW5ydmpndXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MDkzOTAsImV4cCI6MjEwODM4NTM5MH0.chVjshiDlQRDoEIdCvTLNCIvPStxKw-7EDEU8LmdYFQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const statusElement = document.querySelector("#status");
const authCard = document.querySelector("#auth-card");
const dashboard = document.querySelector("#dashboard");
const authViews = [...document.querySelectorAll(".auth-view")];
let currentUser = null;

function showStatus(message, kind = "success") {
    statusElement.textContent = message;
    statusElement.dataset.kind = kind;
    statusElement.hidden = false;
}

function clearStatus() {
    statusElement.textContent = "";
    statusElement.hidden = true;
}

function showAuthView(name) {
    authViews.forEach((view) => {
        view.hidden = view.id !== `auth-${name}`;
    });
    authCard.hidden = false;
    dashboard.hidden = true;
    clearStatus();
}

function showError(error) {
    console.error(error);
    showStatus(error?.message || "The request failed. Please try again.", "error");
}

async function withButton(button, operation) {
    button.disabled = true;
    clearStatus();
    try {
        await operation();
    } catch (error) {
        showError(error);
    } finally {
        button.disabled = false;
    }
}

async function loadNotes() {
    const { data, error } = await supabase
        .from("notes")
        .select("id, message, created_at")
        .order("created_at", { ascending: false });
    if (error) throw error;

    const container = document.querySelector("#notes");
    container.replaceChildren();
    if (!data.length) {
        const empty = document.createElement("p");
        empty.textContent = "No notes yet. Add your first note above.";
        container.append(empty);
        return;
    }

    for (const note of data) {
        const article = document.createElement("article");
        article.className = "note";
        const message = document.createElement("p");
        message.textContent = note.message;
        const footer = document.createElement("footer");
        const date = document.createElement("time");
        date.dateTime = note.created_at;
        date.textContent = new Date(note.created_at).toLocaleString();
        const remove = document.createElement("button");
        remove.className = "danger small-button";
        remove.type = "button";
        remove.textContent = "Delete";
        remove.addEventListener("click", () => {
            withButton(remove, async () => {
                const { error: deleteError } = await supabase
                    .from("notes")
                    .delete()
                    .eq("id", note.id);
                if (deleteError) throw deleteError;
                await loadNotes();
                showStatus("Note deleted.");
            });
        });
        footer.append(date, remove);
        article.append(message, footer);
        container.append(article);
    }
}

async function loadAdminActivity() {
    const panel = document.querySelector("#admin-panel");
    const status = document.querySelector("#admin-status");
    const body = document.querySelector("#admin-users");
    panel.hidden = true;
    status.hidden = true;

    const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "list" },
    });
    if (error) {
        if (error.context?.status === 403) return;
        console.error("Could not load admin activity:", error);
        panel.hidden = false;
        status.textContent = "Admin activity could not be loaded. Check the Supabase Edge Function deployment and logs.";
        status.dataset.kind = "error";
        status.hidden = false;
        return;
    }

    body.replaceChildren();
    if (!data.users.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 4;
        cell.textContent = "No accounts found.";
        row.append(cell);
        body.append(row);
    } else {
        for (const user of data.users) {
            const row = document.createElement("tr");
            for (const [value, isDate] of [
                [user.username, false],
                [user.email, false],
                [user.created_at, true],
                [user.last_sign_in_at, true],
            ]) {
                const cell = document.createElement("td");
                cell.textContent = value
                    ? (isDate ? new Date(value).toLocaleString() : value)
                    : (isDate && value === null ? "No sign-in recorded" : "—");
                row.append(cell);
            }
            const actionCell = document.createElement("td");
            if (user.id !== currentUser.id) {
                const remove = document.createElement("button");
                remove.className = "danger small-button";
                remove.type = "button";
                remove.textContent = "Remove";
                remove.setAttribute("aria-label", `Permanently remove ${user.email}`);
                remove.addEventListener("click", () => {
                    if (!window.confirm(
                        `Permanently remove ${user.email} and all of their notes? This cannot be undone.`,
                    )) return;
                    withButton(remove, async () => {
                        const { error: deleteError } = await supabase.functions.invoke(
                            "admin-users",
                            { body: { action: "delete", user_id: user.id } },
                        );
                        if (deleteError) throw deleteError;
                        await loadAdminActivity();
                        showStatus("Account and its notes permanently removed.");
                    });
                });
                actionCell.append(remove);
            } else {
                actionCell.textContent = "Current admin";
            }
            row.append(actionCell);
            body.append(row);
        }
    }
    panel.hidden = false;
}

document.querySelector("#admin-invite-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const inviteForm = event.currentTarget;
    const form = new FormData(inviteForm);
    withButton(inviteForm.querySelector("button"), async () => {
        const username = String(form.get("username")).trim().toLowerCase();
        const email = String(form.get("email")).trim().toLowerCase();
        if (!username || username.length > 80) {
            throw new Error("Username must be between 1 and 80 characters.");
        }
        const { error } = await supabase.functions.invoke("admin-users", {
            body: { action: "invite", username, email },
        });
        if (error) throw error;
        inviteForm.reset();
        await loadAdminActivity();
        showStatus("Invitation sent. The user must confirm by email before signing in.");
    });
});

async function showDashboard(user) {
    currentUser = user;
    authCard.hidden = true;
    dashboard.hidden = false;
    document.querySelector("#account-email").textContent = user.email || "";

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
    if (error) throw error;
    document.querySelector("#welcome").textContent = `Welcome, ${profile.username}`;
    document.querySelector("#username").value = profile.username;
    await loadNotes();
    await loadAdminActivity();
}

document.querySelectorAll("[data-view]").forEach((link) => {
    link.addEventListener("click", () => showAuthView(link.dataset.view));
});

document.querySelector("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    withButton(event.currentTarget.querySelector("button"), async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: String(form.get("email")).trim(),
            password: String(form.get("password")),
        });
        if (error) throw error;
        const { error: activityError } = await supabase
            .from("login_events")
            .insert({ user_id: data.user.id });
        await showDashboard(data.user);
        if (activityError) {
            console.error("Could not record successful sign-in:", activityError);
            showStatus("Signed in, but this sign-in could not be recorded.", "error");
        }
    });
});

document.querySelector("#register-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    withButton(event.currentTarget.querySelector("button"), async () => {
        const username = String(form.get("username")).trim().toLowerCase();
        const email = String(form.get("email")).trim().toLowerCase();
        const password = String(form.get("password"));
        if (!username || username.length > 80) {
            throw new Error("Username must be between 1 and 80 characters.");
        }
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username },
                emailRedirectTo: window.location.href.split("#")[0],
            },
        });
        if (error) throw error;
        if (data.session) {
            await showDashboard(data.user);
            showStatus("Account created.");
        } else {
            showAuthView("login");
            showStatus("Account created. Check your email to confirm, then sign in.");
        }
    });
});

document.querySelector("#forgot-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    withButton(event.currentTarget.querySelector("button"), async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(
            String(form.get("email")).trim(),
            { redirectTo: window.location.href.split("#")[0] },
        );
        if (error) throw error;
        showAuthView("login");
        showStatus("If that email has an account, a password reset link has been sent.");
    });
});

document.querySelector("#reset-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    withButton(event.currentTarget.querySelector("button"), async () => {
        const { error } = await supabase.auth.updateUser({
            password: String(form.get("password")),
        });
        if (error) throw error;
        await supabase.auth.signOut();
        showAuthView("login");
        showStatus("Password updated. Sign in with your new password.");
    });
});

document.querySelector("#username-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    withButton(event.currentTarget.querySelector("button"), async () => {
        const username = String(form.get("username")).trim().toLowerCase();
        if (!username || username.length > 80) {
            throw new Error("Username must be between 1 and 80 characters.");
        }
        const { error } = await supabase
            .from("profiles")
            .update({ username })
            .eq("id", currentUser.id);
        if (error) throw error;
        document.querySelector("#welcome").textContent = `Welcome, ${username}`;
        showStatus("Username updated.");
    });
});

document.querySelector("#note-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const noteForm = event.currentTarget;
    const form = new FormData(noteForm);
    withButton(event.currentTarget.querySelector("button"), async () => {
        const message = String(form.get("message")).trim();
        if (!message || message.length > 4000) {
            throw new Error("Notes must be between 1 and 4000 characters.");
        }
        const { error } = await supabase.from("notes").insert({ message });
        if (error) throw error;
        noteForm.reset();
        await loadNotes();
        showStatus("Note saved.");
    });
});

document.querySelector("#sign-out").addEventListener("click", (event) => {
    withButton(event.currentTarget, async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        currentUser = null;
        showAuthView("login");
        showStatus("You are signed out.");
    });
});

document.querySelectorAll(".lab-question").forEach((question) => {
    question.querySelectorAll("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => {
            const correct = button.dataset.choice === question.dataset.answer;
            const feedback = question.querySelector(".lab-feedback");
            feedback.textContent = correct
                ? "Correct. This choice follows a defensive security practice."
                : "Not quite. Choose the option that protects users and their data.";
            feedback.dataset.kind = correct ? "success" : "error";
        });
    });
});

const themeToggle = document.querySelector("#theme-toggle");
function setTheme(theme) {
    document.body.dataset.theme = theme;
    themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    localStorage.setItem("mengkhong-theme", theme);
}
setTheme(localStorage.getItem("mengkhong-theme") || "light");
themeToggle.addEventListener("click", () => {
    setTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
});

const recoveryInUrl = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
if (recoveryInUrl) showAuthView("reset");

supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
        showAuthView("reset");
    } else if (event === "SIGNED_OUT") {
        currentUser = null;
        showAuthView("login");
    }
});

const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
if (sessionError) {
    showError(sessionError);
} else if (sessionData.session && !recoveryInUrl) {
    try {
        await showDashboard(sessionData.session.user);
    } catch (error) {
        showError(error);
    }
}

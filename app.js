import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { toolCatalog } from "./tool-catalog.js";

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
    const body = document.querySelector("#admin-users");
    panel.hidden = true;

    const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "list" },
    });
    if (error) {
        if (error.context?.status === 403) return;
        console.error("Could not load admin activity:", error);
        showStatus("Admin features are temporarily unavailable. Please try again later.", "error");
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

const toolSearch = document.querySelector("#tool-search");
const toolCategory = document.querySelector("#tool-category");
const toolCards = document.querySelector("#tool-cards");
const toolCount = document.querySelector("#tool-count");
const toolLanguage = document.querySelector("#tool-language");
const toolLibraryHome = document.querySelector("#tool-library-home");
const toolDetail = document.querySelector("#tool-detail");
const toolCopyFeedback = {
    en: (name) => `${name} example copied.`,
    km: (name) => `បានចម្លងឧទាហរណ៍ ${name}។`,
};
const toolTranslations = {
    en: {
        title: "Kali tool library",
        language: "Language",
        description: "An original starter directory with tool summaries, install commands, safe local or offline examples, and official documentation links. Commands are examples only; this website does not run Kali tools.",
        search: "Search tools",
        searchPlaceholder: "Search by name, package, or topic",
        category: "Filter by category",
        allCategories: "All categories",
        install: "Install on Kali Linux",
        copyExample: "Copy example",
        copiedFallback: "Could not copy the command. Select and copy it instead.",
        official: "Kali documentation",
        viewGuide: "View Nmap guide",
        count: (number) => `${number} ${number === 1 ? "tool" : "tools"}`,
        noResults: "No tools match your search. Try another name or category.",
        back: "Back to tool library",
        subtitle: "A network discovery and service inventory utility. This original guide focuses on basic, authorized checks against your own computer.",
        safetyTitle: "Use responsibly",
        safety: "Only scan devices and networks that you own or have explicit permission to test. The examples below use the localhost address 127.0.0.1. This page displays commands as text and never executes them.",
        categoriesTitle: "Categories",
        categories: "Network discovery · Service inventory · Authorized security auditing",
        packagesTitle: "Package and utilities",
        packageLabel: "Kali package",
        utilities: "The package includes Nmap and companion utilities such as Ncat, Ndiff, and Nping. Each has a distinct purpose; consult the official manuals before use.",
        commandsTitle: "Safe local examples",
        commandLabels: [
            "Basic localhost scan",
            "Check localhost availability",
            "Check selected ports on localhost",
            "Identify services on localhost",
        ],
        commandNotes: [
            "Lists commonly checked TCP ports on this same computer.",
            "Checks whether the local computer responds to host discovery.",
            "Checks only the listed ports on this same computer.",
            "Attempts service identification only on this same computer.",
        ],
        installTitle: "Install",
        versionNote: "The available package version can change with Kali updates. Check your installed release with nmap --version.",
        officialTitle: "Official resources",
        homepage: "Nmap project homepage",
        packagePage: "Kali package page",
        source: "Source code repository",
        copy: "Copy",
        copied: "Copied",
    },
    km: {
        title: "បណ្ណាល័យឧបករណ៍ Kali",
        language: "ភាសា",
        description: "បញ្ជីឧបករណ៍ដើមដែលមានសេចក្ដីសង្ខេប ពាក្យបញ្ជាដំឡើង ឧទាហរណ៍សុវត្ថិភាពក្នុងម៉ាស៊ីនផ្ទាល់ខ្លួន ឬក្រៅបណ្ដាញ និងតំណទៅឯកសារផ្លូវការ។ ពាក្យបញ្ជាគ្រាន់តែជាឧទាហរណ៍ប៉ុណ្ណោះ គេហទំព័រនេះមិនដំណើរការឧបករណ៍ Kali ទេ។",
        search: "ស្វែងរកឧបករណ៍",
        searchPlaceholder: "ស្វែងរកតាមឈ្មោះ កញ្ចប់ ឬប្រធានបទ",
        category: "ត្រងតាមប្រភេទ",
        allCategories: "គ្រប់ប្រភេទ",
        install: "ដំឡើងលើ Kali Linux",
        copyExample: "ចម្លងឧទាហរណ៍",
        copiedFallback: "មិនអាចចម្លងពាក្យបញ្ជាបានទេ។ សូមជ្រើសរើស ហើយចម្លងវាដោយដៃ។",
        official: "ឯកសារ Kali",
        viewGuide: "មើលមគ្គុទ្ទេសក៍ Nmap",
        count: (number) => `ឧបករណ៍ ${number}`,
        noResults: "រកមិនឃើញឧបករណ៍ដែលត្រូវនឹងការស្វែងរកទេ។ សូមសាកល្បងឈ្មោះ ឬប្រភេទផ្សេង។",
        back: "ត្រឡប់ទៅបណ្ណាល័យឧបករណ៍",
        subtitle: "ឧបករណ៍សម្រាប់ស្វែងរកបណ្ដាញ និងរៀបចំបញ្ជីសេវាកម្ម។ មគ្គុទ្ទេសក៍ដើមនេះផ្ដោតលើការត្រួតពិនិត្យមូលដ្ឋានដែលមានការអនុញ្ញាតលើកុំព្យូទ័រផ្ទាល់ខ្លួន។",
        safetyTitle: "ប្រើប្រាស់ដោយទទួលខុសត្រូវ",
        safety: "ស្កេនតែឧបករណ៍ និងបណ្ដាញដែលជាកម្មសិទ្ធិរបស់អ្នក ឬដែលអ្នកមានការអនុញ្ញាតច្បាស់លាស់ឱ្យសាកល្បងប៉ុណ្ណោះ។ ឧទាហរណ៍ខាងក្រោមប្រើអាសយដ្ឋានម៉ាស៊ីនផ្ទាល់ខ្លួន 127.0.0.1។ ទំព័រនេះបង្ហាញពាក្យបញ្ជាជាអត្ថបទ ហើយមិនដំណើរការពាក្យបញ្ជាទាំងនោះទេ។",
        categoriesTitle: "ប្រភេទ",
        categories: "ការស្វែងរកបណ្ដាញ · ការរៀបចំបញ្ជីសេវាកម្ម · សវនកម្មសុវត្ថិភាពដែលមានការអនុញ្ញាត",
        packagesTitle: "កញ្ចប់ និងឧបករណ៍រង",
        packageLabel: "កញ្ចប់ Kali",
        utilities: "កញ្ចប់នេះរួមមាន Nmap និងឧបករណ៍ជំនួយដូចជា Ncat, Ndiff និង Nping។ ឧបករណ៍នីមួយៗមានតួនាទីខុសគ្នា សូមអានសៀវភៅណែនាំផ្លូវការមុនប្រើប្រាស់។",
        commandsTitle: "ឧទាហរណ៍សុវត្ថិភាពក្នុងម៉ាស៊ីនផ្ទាល់ខ្លួន",
        commandLabels: [
            "ស្កេនម៉ាស៊ីនផ្ទាល់ខ្លួនជាមូលដ្ឋាន",
            "ពិនិត្យការឆ្លើយតបរបស់ម៉ាស៊ីនផ្ទាល់ខ្លួន",
            "ពិនិត្យច្រកដែលបានជ្រើសលើម៉ាស៊ីនផ្ទាល់ខ្លួន",
            "កំណត់សេវាកម្មលើម៉ាស៊ីនផ្ទាល់ខ្លួន",
        ],
        commandNotes: [
            "រាយបញ្ជីច្រក TCP ដែលត្រូវបានពិនិត្យជាទូទៅលើកុំព្យូទ័រនេះផ្ទាល់។",
            "ពិនិត្យថាតើកុំព្យូទ័រផ្ទាល់ខ្លួនឆ្លើយតបចំពោះការស្វែងរកម៉ាស៊ីនឬទេ។",
            "ពិនិត្យតែច្រកដែលបានរាយបញ្ជីលើកុំព្យូទ័រនេះផ្ទាល់។",
            "ព្យាយាមកំណត់សេវាកម្មតែលើកុំព្យូទ័រនេះផ្ទាល់។",
        ],
        installTitle: "ការដំឡើង",
        versionNote: "កំណែកញ្ចប់អាចផ្លាស់ប្ដូរតាមបច្ចុប្បន្នភាពរបស់ Kali។ ពិនិត្យកំណែដែលបានដំឡើងដោយប្រើ nmap --version។",
        officialTitle: "ធនធានផ្លូវការ",
        homepage: "គេហទំព័រគម្រោង Nmap",
        packagePage: "ទំព័រកញ្ចប់ Kali",
        source: "ឃ្លាំងកូដប្រភព",
        copy: "ចម្លង",
        copied: "បានចម្លង",
    },
};

const toolIconShapes = {
    nmap: [
        { tag: "circle", attrs: { cx: "27", cy: "27", r: "15" } },
        { tag: "path", attrs: { d: "m38 38 14 14M12 27h30M27 12v30" } },
        { tag: "circle", attrs: { cx: "27", cy: "27", r: "5" } },
    ],
    wireshark: [
        { tag: "path", attrs: { d: "M6 34c7 0 7-16 14-16s7 28 14 28 7-24 14-24 7 12 10 12" } },
        { tag: "path", attrs: { d: "M7 52h50M7 12h50" } },
    ],
    shield: [
        { tag: "path", attrs: { d: "M32 6 52 14v15c0 13-8 22-20 29C20 51 12 42 12 29V14z" } },
        { tag: "path", attrs: { d: "m22 32 7 7 14-16" } },
    ],
    traffic: [
        { tag: "path", attrs: { d: "M7 42h9l7-20 10 28 8-20 5 12h11" } },
        { tag: "path", attrs: { d: "M8 12h48M8 54h48" } },
    ],
    audit: [
        { tag: "rect", attrs: { x: "14", y: "10", width: "36", height: "46", rx: "5" } },
        { tag: "path", attrs: { d: "M25 10V6h14v8H25zM21 28l4 4 7-8M36 29h8M21 43l4 4 7-8M36 44h8" } },
    ],
    malware: [
        { tag: "path", attrs: { d: "M32 7 51 14v14c0 13-7 21-19 29C20 49 13 41 13 28V14z" } },
        { tag: "path", attrs: { d: "M32 20v18M23 29h18M25 23l14 14M39 23 25 37" } },
        { tag: "circle", attrs: { cx: "32", cy: "29", r: "10" } },
    ],
    hash: [
        { tag: "path", attrs: { d: "m24 9-6 46M46 9l-6 46M11 25h43M8 41h43" } },
    ],
    forensics: [
        { tag: "path", attrs: { d: "M15 8h23l12 12v36H15zM38 8v13h12" } },
        { tag: "circle", attrs: { cx: "29", cy: "36", r: "8" } },
        { tag: "path", attrs: { d: "m35 42 8 8M23 25h8" } },
    ],
};

function createToolIcon(iconName, large = false) {
    const wrapper = document.createElement("span");
    wrapper.className = `tool-icon tool-icon-${iconName}${large ? " tool-icon-large" : ""}`;
    wrapper.setAttribute("aria-hidden", "true");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "3");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("focusable", "false");

    for (const shape of toolIconShapes[iconName] || []) {
        const element = document.createElementNS("http://www.w3.org/2000/svg", shape.tag);
        for (const [name, value] of Object.entries(shape.attrs)) {
            element.setAttribute(name, value);
        }
        svg.append(element);
    }
    wrapper.append(svg);
    return wrapper;
}

let toolPageLanguage = localStorage.getItem("mengkhong-tool-language") === "km" ? "km" : "en";
toolLanguage.value = toolPageLanguage;

for (const category of [...new Set(toolCatalog.map((tool) => tool.category))].sort()) {
    const option = document.createElement("option");
    option.value = category;
    toolCategory.append(option);
}

function activeToolTranslation() {
    return toolTranslations[toolPageLanguage];
}

function localizeToolLibrary() {
    const text = activeToolTranslation();
    document.querySelector("#tool-library").lang = toolPageLanguage;
    document.querySelector("#tool-library-title").textContent = text.title;
    document.querySelector("#tool-language-label").textContent = text.language;
    document.querySelector("#tool-library-description").textContent = text.description;
    document.querySelector("#tool-search-label").textContent = text.search;
    toolSearch.placeholder = text.searchPlaceholder;
    document.querySelector("#tool-category-label").textContent = text.category;
    toolCategory.options[0].textContent = text.allCategories;
    for (const option of [...toolCategory.options].slice(1)) {
        const entry = toolCatalog.find((tool) => tool.category === option.value);
        option.textContent = toolPageLanguage === "km" ? entry.categoryKm : entry.category;
    }
    renderToolCatalog();
    if (!toolDetail.hidden) renderNmapGuide();
}

function renderToolCatalog() {
    const text = activeToolTranslation();
    const query = toolSearch.value.trim().toLowerCase();
    const category = toolCategory.value;
    const filteredTools = toolCatalog.filter((tool) => {
        const matchesCategory = !category || tool.category === category;
        const searchableText = `${tool.name} ${tool.category} ${tool.categoryKm} ${tool.summary} ${tool.summaryKm} ${tool.packageName}`.toLowerCase();
        return matchesCategory && searchableText.includes(query);
    });

    toolCards.replaceChildren();
    toolCount.textContent = text.count(filteredTools.length);

    if (!filteredTools.length) {
        const empty = document.createElement("p");
        empty.className = "tool-empty";
        empty.textContent = text.noResults;
        toolCards.append(empty);
        return;
    }

    for (const tool of filteredTools) {
        const article = document.createElement("article");
        article.className = "tool-card";

        const top = document.createElement("div");
        top.className = "tool-card-top";
        top.append(createToolIcon(tool.icon));

        const heading = document.createElement("div");
        heading.className = "tool-card-heading";
        const title = document.createElement("h3");
        title.textContent = tool.name;
        const categoryLabel = document.createElement("span");
        categoryLabel.className = "tool-category";
        categoryLabel.textContent = toolPageLanguage === "km" ? tool.categoryKm : tool.category;
        heading.append(title, categoryLabel);
        top.append(heading);

        const summary = document.createElement("p");
        summary.textContent = toolPageLanguage === "km" ? tool.summaryKm : tool.summary;

        const installLabel = document.createElement("span");
        installLabel.className = "tool-command-label";
        installLabel.textContent = text.install;
        const installCommand = document.createElement("code");
        installCommand.className = "tool-command";
        installCommand.textContent = `sudo apt install ${tool.packageName}`;

        const exampleLabel = document.createElement("span");
        exampleLabel.className = "tool-command-label";
        exampleLabel.textContent = toolPageLanguage === "km" ? tool.commandLabelKm : tool.commandLabel;
        const exampleCommand = document.createElement("code");
        exampleCommand.className = "tool-command";
        exampleCommand.textContent = tool.command;

        const actions = document.createElement("div");
        actions.className = "tool-actions";
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "secondary small-button";
        copyButton.textContent = text.copyExample;
        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(tool.command);
                showStatus(toolCopyFeedback[toolPageLanguage](tool.name));
            } catch (error) {
                console.error("Could not copy tool example:", error);
                showStatus(text.copiedFallback, "error");
            }
        });

        if (tool.name === "Nmap") {
            const guideButton = document.createElement("button");
            guideButton.type = "button";
            guideButton.className = "secondary small-button";
            guideButton.textContent = text.viewGuide;
            guideButton.addEventListener("click", openNmapGuide);
            actions.append(guideButton);
        }

        const officialLink = document.createElement("a");
        officialLink.href = tool.kaliUrl;
        officialLink.target = "_blank";
        officialLink.rel = "noopener noreferrer";
        officialLink.textContent = text.official;
        actions.append(copyButton, officialLink);
        article.append(
            top,
            summary,
            installLabel,
            installCommand,
            exampleLabel,
            exampleCommand,
            actions,
        );
        toolCards.append(article);
    }
}

function appendDetailBlock(parent, title, content) {
    const block = document.createElement("section");
    block.className = "tool-detail-block";
    const heading = document.createElement("h3");
    heading.textContent = title;
    block.append(heading);
    if (content instanceof Node) block.append(content);
    else {
        const paragraph = document.createElement("p");
        paragraph.textContent = content;
        block.append(paragraph);
    }
    parent.append(block);
}

function addCopyableCommand(parent, command, label, note) {
    const row = document.createElement("div");
    row.className = "tool-command-row";
    const content = document.createElement("div");
    const commandLabel = document.createElement("span");
    commandLabel.className = "tool-command-label";
    commandLabel.textContent = label;
    const code = document.createElement("code");
    code.className = "tool-command";
    code.textContent = command;
    content.append(commandLabel, code);
    if (note) {
        const explanation = document.createElement("p");
        explanation.textContent = note;
        content.append(explanation);
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary small-button";
    button.textContent = activeToolTranslation().copy;
    button.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(command);
            showStatus(toolCopyFeedback[toolPageLanguage]("Nmap"));
        } catch (error) {
            console.error("Could not copy Nmap example:", error);
            showStatus(activeToolTranslation().copiedFallback, "error");
        }
    });
    row.append(content, button);
    parent.append(row);
}

function renderNmapGuide() {
    const text = activeToolTranslation();
    toolDetail.replaceChildren();

    const back = document.createElement("button");
    back.type = "button";
    back.className = "secondary small-button";
    back.textContent = text.back;
    back.addEventListener("click", () => {
        toolDetail.hidden = true;
        toolLibraryHome.hidden = false;
    });
    toolDetail.append(back);

    const top = document.createElement("div");
    top.className = "tool-detail-top";
    const mark = document.createElement("div");
    mark.className = "tool-original-mark";
    mark.setAttribute("role", "img");
    mark.setAttribute("aria-label", "Original MengKhong Nmap guide icon");
    mark.append(createToolIcon("nmap", true));
    const headingGroup = document.createElement("div");
    const heading = document.createElement("h2");
    heading.textContent = "Nmap";
    const subtitle = document.createElement("p");
    subtitle.textContent = text.subtitle;
    const meta = document.createElement("div");
    meta.className = "tool-meta";
    for (const label of ["Network discovery", "Service inventory", "Kali package: nmap"]) {
        const badge = document.createElement("span");
        badge.className = "tool-category";
        badge.textContent = toolPageLanguage === "km"
            ? ({
                "Network discovery": "ការស្វែងរកបណ្ដាញ",
                "Service inventory": "ការរៀបចំបញ្ជីសេវាកម្ម",
                "Kali package: nmap": "កញ្ចប់ Kali៖ nmap",
            }[label])
            : label;
        meta.append(badge);
    }
    headingGroup.append(heading, subtitle, meta);
    top.append(mark, headingGroup);
    toolDetail.append(top);

    const caution = document.createElement("p");
    caution.className = "status";
    const cautionTitle = document.createElement("strong");
    cautionTitle.textContent = `${text.safetyTitle}: `;
    caution.append(cautionTitle, document.createTextNode(text.safety));
    toolDetail.append(caution);

    appendDetailBlock(toolDetail, text.categoriesTitle, text.categories);

    const packageInfo = document.createElement("div");
    const packageLine = document.createElement("p");
    const packageLabel = document.createElement("strong");
    packageLabel.textContent = `${text.packageLabel}: `;
    packageLine.append(packageLabel, document.createTextNode("nmap"));
    const utilityList = document.createElement("p");
    utilityList.textContent = text.utilities;
    const versionNote = document.createElement("p");
    versionNote.textContent = text.versionNote;
    packageInfo.append(packageLine, utilityList, versionNote);
    appendDetailBlock(toolDetail, text.packagesTitle, packageInfo);

    const commands = document.createElement("div");
    addCopyableCommand(
        commands,
        "nmap 127.0.0.1",
        text.commandLabels[0],
        text.commandNotes[0],
    );
    addCopyableCommand(
        commands,
        "nmap -sn 127.0.0.1",
        text.commandLabels[1],
        text.commandNotes[1],
    );
    addCopyableCommand(
        commands,
        "nmap -p 22,80,443 127.0.0.1",
        text.commandLabels[2],
        text.commandNotes[2],
    );
    addCopyableCommand(
        commands,
        "nmap -sV 127.0.0.1",
        text.commandLabels[3],
        text.commandNotes[3],
    );
    appendDetailBlock(toolDetail, text.commandsTitle, commands);

    const install = document.createElement("div");
    const installCommand = document.createElement("code");
    installCommand.className = "tool-command";
    installCommand.textContent = "sudo apt install nmap";
    install.append(installCommand);
    appendDetailBlock(toolDetail, text.installTitle, install);

    const links = document.createElement("div");
    for (const [label, href] of [
        [text.homepage, "https://nmap.org/"],
        [text.packagePage, "https://www.kali.org/tools/nmap/"],
        [text.source, "https://github.com/nmap/nmap"],
    ]) {
        const link = document.createElement("p");
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = label;
        link.append(anchor);
        links.append(link);
    }
    appendDetailBlock(toolDetail, text.officialTitle, links);
}

function openNmapGuide() {
    toolLibraryHome.hidden = true;
    toolDetail.hidden = false;
    renderNmapGuide();
    document.querySelector("#tool-library").scrollIntoView({ behavior: "smooth", block: "start" });
}

toolSearch.addEventListener("input", renderToolCatalog);
toolCategory.addEventListener("change", renderToolCatalog);
toolLanguage.addEventListener("change", () => {
    toolPageLanguage = toolLanguage.value;
    localStorage.setItem("mengkhong-tool-language", toolPageLanguage);
    localizeToolLibrary();
});
localizeToolLibrary();

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

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { toolIndex } from "./tool-index.js";
import { safeToolProfiles } from "./tool-profiles.js";
import { toolImageFiles } from "./tool-image-map.js";

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

const dashboardTabs = [...document.querySelectorAll("[data-dashboard-tab]")];
const dashboardPanels = new Map(
    dashboardTabs.map((tab) => [
        tab.dataset.dashboardTab,
        document.querySelector(`#dashboard-panel-${tab.dataset.dashboardTab}`),
    ]),
);

function selectDashboardTab(name) {
    for (const tab of dashboardTabs) {
        const selected = tab.dataset.dashboardTab === name;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        dashboardPanels.get(tab.dataset.dashboardTab).hidden = !selected;
    }
}

for (const [index, tab] of dashboardTabs.entries()) {
    tab.addEventListener("click", () => selectDashboardTab(tab.dataset.dashboardTab));
    tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const selectedIndex = event.key === "Home"
            ? 0
            : event.key === "End"
                ? dashboardTabs.length - 1
                : (index + (event.key === "ArrowRight" ? 1 : dashboardTabs.length - 1)) % dashboardTabs.length;
        dashboardTabs[selectedIndex].focus();
        dashboardTabs[selectedIndex].click();
    });
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

const toolSearch = document.querySelector("#tool-search");
const toolCategory = document.querySelector("#tool-category");
const toolCards = document.querySelector("#tool-cards");
const toolCount = document.querySelector("#tool-count");
const toolLanguage = document.querySelector("#tool-language");
const toolLibraryHome = document.querySelector("#tool-library-home");
const toolDetail = document.querySelector("#tool-detail");
const toolImageDirectory = "./image/Kali%20Tools%20_%20Kali%20Linux%20Tools/";
const normalizeToolImageKey = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const toolCatalog = toolIndex.map((tool) => {
    const profile = safeToolProfiles[normalizeToolImageKey(tool.name)];
    const imageFile = toolImageFiles[normalizeToolImageKey(tool.name)]
        || toolImageFiles[normalizeToolImageKey(tool.slug)]
        || toolImageFiles.toolsiconmissing;
    return { ...tool, ...profile, imageFile };
});
const toolCopyFeedback = {
    en: (name) => `${name} example copied.`,
    km: (name) => `បានចម្លងឧទាហរណ៍ ${name}។`,
};
const toolTranslations = {
    en: {
        title: "Kali tool library",
        language: "Language",
        description: "Browse Kali tool names and categories. Selected defensive tools have original profiles and local or offline demos; other tools link to official documentation.",
        source: "Open the official Kali tools index",
        artworkNote: "Tool artwork is shown for identification and links to its Kali documentation. NiNJa GO is an independent project and is not affiliated with Kali Linux.",
        search: "Search tools",
        searchPlaceholder: "Search by tool name or category",
        category: "Filter by category",
        allCategories: "All categories",
        install: "Install on Kali Linux",
        copyExample: "Copy example",
        copiedFallback: "Could not copy the command. Select and copy it instead.",
        official: "Kali documentation",
        viewProfile: "View profile",
        count: (number) => `${number} ${number === 1 ? "tool" : "tools"}`,
        noResults: "No tools match your search. Try another name or category.",
        back: "Back to tool library",
        tabsLabel: "Tool profile sections",
        profileTabs: ["Overview", "Safe example", "Package & links"],
        profileSummary: "About this tool",
        profileUse: "Typical defensive use",
        usePermission: "Only run tools on systems and data you own or are explicitly authorized to assess. Commands are examples only; this website never executes them.",
        exampleTitle: "Example command",
        packageTitle: "Kali package",
        profileInstallTitle: "Install command",
        kaliReference: "Kali tool profile",
        copy: "Copy",
    },
    km: {
        title: "បណ្ណាល័យឧបករណ៍ Kali",
        language: "ភាសា",
        description: "រកមើលឈ្មោះឧបករណ៍ Kali និងប្រភេទឧបករណ៍។ ឧបករណ៍ការពារដែលបានជ្រើសរើសមានព័ត៌មាន និងឧទាហរណ៍ក្នុងម៉ាស៊ីន ឬក្រៅបណ្ដាញ។ ឧបករណ៍ផ្សេងទៀតមានតំណទៅឯកសារផ្លូវការ។",
        source: "បើកបញ្ជីឧបករណ៍ផ្លូវការរបស់ Kali",
        artworkNote: "រូបតំណាងឧបករណ៍ប្រើសម្រាប់កំណត់អត្តសញ្ញាណ និងមានតំណទៅឯកសារ Kali។ NiNJa GO ជាគម្រោងឯករាជ្យ និងមិនមានទំនាក់ទំនងជាមួយ Kali Linux ទេ។",
        search: "ស្វែងរកឧបករណ៍",
        searchPlaceholder: "ស្វែងរកតាមឈ្មោះឧបករណ៍ ឬប្រភេទ",
        category: "ត្រងតាមប្រភេទ",
        allCategories: "គ្រប់ប្រភេទ",
        install: "ដំឡើងលើ Kali Linux",
        copyExample: "ចម្លងឧទាហរណ៍",
        copiedFallback: "មិនអាចចម្លងពាក្យបញ្ជាបានទេ។ សូមជ្រើសរើស ហើយចម្លងវាដោយដៃ។",
        official: "ឯកសារ Kali",
        viewProfile: "មើលព័ត៌មានឧបករណ៍",
        count: (number) => `ឧបករណ៍ ${number}`,
        noResults: "រកមិនឃើញឧបករណ៍ដែលត្រូវនឹងការស្វែងរកទេ។ សូមសាកល្បងឈ្មោះ ឬប្រភេទផ្សេង។",
        back: "ត្រឡប់ទៅបណ្ណាល័យឧបករណ៍",
        tabsLabel: "ផ្នែកព័ត៌មានឧបករណ៍",
        profileTabs: ["ទិដ្ឋភាពទូទៅ", "ឧទាហរណ៍សុវត្ថិភាព", "កញ្ចប់ និងតំណ"],
        profileSummary: "អំពីឧបករណ៍នេះ",
        profileUse: "ការប្រើប្រាស់ផ្នែកការពារទូទៅ",
        usePermission: "ដំណើរការឧបករណ៍តែលើប្រព័ន្ធ និងទិន្នន័យដែលជាកម្មសិទ្ធិរបស់អ្នក ឬដែលអ្នកមានការអនុញ្ញាតច្បាស់លាស់ឱ្យវាយតម្លៃប៉ុណ្ណោះ។ ពាក្យបញ្ជាគ្រាន់តែជាឧទាហរណ៍ គេហទំព័រនេះមិនដំណើរការពាក្យបញ្ជាទេ។",
        exampleTitle: "ពាក្យបញ្ជាឧទាហរណ៍",
        packageTitle: "កញ្ចប់ Kali",
        profileInstallTitle: "ពាក្យបញ្ជាដំឡើង",
        kaliReference: "ព័ត៌មានឧបករណ៍ Kali",
        copy: "ចម្លង",
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
const toolCategoryIcons = {
    "Reconnaissance": "nmap",
    "Resource Development": "hash",
    "Initial Access": "nmap",
    "Execution": "audit",
    "Persistence": "audit",
    "Privilege Escalation": "shield",
    "Defense Evasion": "shield",
    "Credential Access": "hash",
    "Discovery": "nmap",
    "Lateral Movement": "traffic",
    "Collection": "forensics",
    "Command and Control": "traffic",
    "Exfiltration": "traffic",
    "Impact": "shield",
    "Forensics": "forensics",
    "Services and Other Tools": "audit",
};
const toolCategoryOrder = Object.keys(toolCategoryIcons);

function createToolIcon(iconName, large = false, imageFile = null) {
    const wrapper = document.createElement("span");
    wrapper.className = `tool-icon tool-icon-${iconName}${large ? " tool-icon-large" : ""}`;
    wrapper.setAttribute("aria-hidden", "true");

    if (imageFile) {
        const image = document.createElement("img");
        image.src = `${toolImageDirectory}${encodeURIComponent(imageFile)}`;
        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";
        wrapper.append(image);
        return wrapper;
    }

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
let activeToolProfile = null;
const toolCategoryNamesKm = {
    "Reconnaissance": "ការស៊ើបអង្កេត",
    "Resource Development": "ការរៀបចំធនធាន",
    "Initial Access": "ការចូលប្រើដំបូង",
    "Execution": "ការប្រតិបត្តិ",
    "Persistence": "ភាពបន្ត",
    "Privilege Escalation": "ការបង្កើនសិទ្ធិ",
    "Defense Evasion": "ការគេចវេសពីការការពារ",
    "Credential Access": "ការចូលប្រើព័ត៌មានសម្ងាត់",
    "Discovery": "ការស្វែងរក",
    "Lateral Movement": "ការផ្លាស់ទីបន្តបន្ទាប់",
    "Collection": "ការប្រមូលទិន្នន័យ",
    "Command and Control": "ការបញ្ជា និងគ្រប់គ្រង",
    "Exfiltration": "ការបញ្ជូនទិន្នន័យចេញ",
    "Impact": "ផលប៉ះពាល់",
    "Forensics": "កោសល្យវិច្ច័យ",
    "Services and Other Tools": "សេវាកម្ម និងឧបករណ៍ផ្សេងៗ",
};

function localizedToolCategory(category) {
    return toolPageLanguage === "km" ? toolCategoryNamesKm[category] || category : category;
}

for (const category of toolCategoryOrder.filter((name) => toolCatalog.some((tool) => tool.category === name))) {
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
    document.querySelector("#tool-index-source").textContent = text.source;
    document.querySelector("#tool-artwork-note").textContent = text.artworkNote;
    document.querySelector("#tool-search-label").textContent = text.search;
    toolSearch.placeholder = text.searchPlaceholder;
    document.querySelector("#tool-category-label").textContent = text.category;
    toolCategory.options[0].textContent = text.allCategories;
    for (const option of [...toolCategory.options].slice(1)) {
        option.textContent = localizedToolCategory(option.value);
    }
    renderToolCatalog();
}

function renderToolCatalog() {
    const text = activeToolTranslation();
    const query = toolSearch.value.trim().toLowerCase();
    const category = toolCategory.value;
    const filteredTools = toolCatalog.filter((tool) => {
        const matchesCategory = !category || tool.category === category;
        const searchableText = `${tool.name} ${tool.slug} ${tool.category} ${localizedToolCategory(tool.category)}`.toLowerCase();
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

    const toolsByCategory = new Map();
    for (const tool of filteredTools) {
        if (!toolsByCategory.has(tool.category)) toolsByCategory.set(tool.category, []);
        toolsByCategory.get(tool.category).push(tool);
    }

    for (const [toolCategoryName, tools] of [...toolsByCategory].sort(
        ([left], [right]) => toolCategoryOrder.indexOf(left) - toolCategoryOrder.indexOf(right),
    )) {
        const section = document.createElement("section");
        section.className = "tool-category-card";
        const heading = document.createElement("h3");
        heading.className = "tool-category-heading";
        heading.append(createToolIcon(
            toolCategoryIcons[toolCategoryName] || "audit",
            false,
            toolImageFiles[normalizeToolImageKey(toolCategoryName)],
        ));
        const categoryTitle = document.createElement("span");
        categoryTitle.textContent = localizedToolCategory(toolCategoryName);
        heading.append(categoryTitle);
        const list = document.createElement("ul");
        list.className = "tool-directory-list";

        for (const tool of tools) {
            const item = document.createElement("li");
            item.className = "tool-directory-item";
            const icon = createToolIcon(
                tool.icon || toolCategoryIcons[toolCategoryName] || "audit",
                false,
                tool.imageFile,
            );
            icon.classList.add("tool-icon-small");
            const officialLink = document.createElement("a");
            officialLink.href = `https://www.kali.org/tools/${encodeURIComponent(tool.slug)}/`;
            officialLink.target = "_blank";
            officialLink.rel = "noopener noreferrer";
            officialLink.textContent = tool.name;
            item.append(icon, officialLink);
            if (tool.summary) {
                const profileButton = document.createElement("button");
                profileButton.type = "button";
                profileButton.className = "tool-profile-link";
                profileButton.textContent = text.viewProfile;
                profileButton.addEventListener("click", () => openToolProfile(tool));
                item.append(profileButton);
            }
            list.append(item);
        }

        section.append(heading, list);
        toolCards.append(section);
    }
}

function appendDetailBlock(parent, title, content) {
    const block = document.createElement("section");
    block.className = "tool-detail-block";
    const heading = document.createElement("h3");
    heading.textContent = title;
    block.append(heading);
    if (content instanceof Node) block.append(content);
    else if (content) {
        const paragraph = document.createElement("p");
        paragraph.textContent = content;
        block.append(paragraph);
    }
    parent.append(block);
}

function addCopyableCommand(parent, tool, command, label, note) {
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
            showStatus(toolCopyFeedback[toolPageLanguage](tool.name));
        } catch (error) {
            console.error(`Could not copy ${tool.name} example:`, error);
            showStatus(activeToolTranslation().copiedFallback, "error");
        }
    });
    row.append(content, button);
    parent.append(row);
}

function renderToolProfile(tool) {
    const text = activeToolTranslation();
    toolDetail.replaceChildren();

    const back = document.createElement("button");
    back.type = "button";
    back.className = "secondary small-button";
    back.textContent = text.back;
    back.addEventListener("click", () => {
        toolDetail.hidden = true;
        toolLibraryHome.hidden = false;
        activeToolProfile = null;
    });
    toolDetail.append(back);

    const top = document.createElement("div");
    top.className = "tool-detail-top";
    const mark = document.createElement("div");
    mark.className = "tool-original-mark";
    mark.setAttribute("role", "img");
    mark.setAttribute("aria-label", `NiNJa GO ${tool.name} tool icon`);
    mark.append(createToolIcon(tool.icon, true, tool.imageFile));
    const headingGroup = document.createElement("div");
    const heading = document.createElement("h2");
    heading.textContent = tool.name;
    const subtitle = document.createElement("p");
    subtitle.textContent = toolPageLanguage === "km" ? tool.summaryKm : tool.summary;
    const meta = document.createElement("div");
    meta.className = "tool-meta";
    for (const label of [
        toolPageLanguage === "km" ? tool.categoryKm : tool.category,
        `${toolPageLanguage === "km" ? text.packageTitle : "Package"}: ${tool.packageName}`,
    ]) {
        const badge = document.createElement("span");
        badge.className = "tool-category";
        badge.textContent = label;
        meta.append(badge);
    }
    headingGroup.append(heading, subtitle, meta);
    top.append(mark, headingGroup);
    toolDetail.append(top);

    const tabs = document.createElement("div");
    tabs.className = "tool-profile-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", text.tabsLabel);
    const panels = [];
    const tabNames = ["overview", "example", "package"];
    for (let index = 0; index < tabNames.length; index += 1) {
        const tabName = tabNames[index];
        const tab = document.createElement("button");
        const panel = document.createElement("section");
        const tabId = `tool-tab-${tool.packageName}-${tabName}`;
        const panelId = `tool-panel-${tool.packageName}-${tabName}`;
        tab.type = "button";
        tab.id = tabId;
        tab.className = "secondary small-button";
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-controls", panelId);
        tab.setAttribute("aria-selected", index === 0 ? "true" : "false");
        tab.tabIndex = index === 0 ? 0 : -1;
        tab.textContent = text.profileTabs[index];
        panel.id = panelId;
        panel.className = "tool-profile-panel";
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tabId);
        panel.hidden = index !== 0;
        tab.addEventListener("click", () => {
            for (const [panelIndex, existingPanel] of panels.entries()) {
                const selected = panelIndex === index;
                existingPanel.hidden = !selected;
                tabs.children[panelIndex].setAttribute("aria-selected", String(selected));
                tabs.children[panelIndex].tabIndex = selected ? 0 : -1;
            }
        });
        tab.addEventListener("keydown", (event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const selectedIndex = event.key === "Home"
                ? 0
                : event.key === "End"
                    ? tabNames.length - 1
                    : (index + (event.key === "ArrowRight" ? 1 : tabNames.length - 1)) % tabNames.length;
            tabs.children[selectedIndex].focus();
            tabs.children[selectedIndex].click();
        });
        tabs.append(tab);
        panels.push(panel);
    }

    const overview = panels[0];
    appendDetailBlock(
        overview,
        text.profileSummary,
        toolPageLanguage === "km" ? tool.summaryKm : tool.summary,
    );
    appendDetailBlock(
        overview,
        text.profileUse,
        toolPageLanguage === "km" ? tool.commandDescriptionKm : tool.commandDescription,
    );
    const authorizationNote = document.createElement("p");
    authorizationNote.className = "status";
    authorizationNote.textContent = text.usePermission;
    overview.append(authorizationNote);

    const example = panels[1];
    appendDetailBlock(example, text.exampleTitle, "");
    const toolExamples = tool.examples || [{
        command: tool.command,
        label: toolPageLanguage === "km" ? tool.commandLabelKm : tool.commandLabel,
        description: toolPageLanguage === "km" ? tool.commandDescriptionKm : tool.commandDescription,
    }];
    for (const exampleItem of toolExamples) {
        addCopyableCommand(
            example,
            tool,
            exampleItem.command,
            toolPageLanguage === "km" ? exampleItem.labelKm || exampleItem.label : exampleItem.label,
            toolPageLanguage === "km"
                ? exampleItem.descriptionKm || exampleItem.description
                : exampleItem.description,
        );
    }

    const packageInfo = panels[2];
    appendDetailBlock(packageInfo, text.profileInstallTitle, "");
    const installCommand = document.createElement("code");
    installCommand.className = "tool-command";
    installCommand.textContent = `sudo apt install ${tool.packageName}`;
    packageInfo.append(installCommand);
    appendDetailBlock(packageInfo, text.kaliReference, "");
    const officialLink = document.createElement("a");
    officialLink.href = tool.kaliUrl;
    officialLink.target = "_blank";
    officialLink.rel = "noopener noreferrer";
    officialLink.textContent = tool.kaliUrl;
    packageInfo.append(officialLink);

    toolDetail.append(tabs, ...panels);
}

function openToolProfile(tool) {
    activeToolProfile = tool;
    toolLibraryHome.hidden = true;
    toolDetail.hidden = false;
    renderToolProfile(tool);
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

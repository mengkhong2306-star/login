import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { toolIndex } from "./tool-index.js";
import { blackArchIndex } from "./blackarch-index.js";
import { safeToolProfiles } from "./tool-profiles.js";
import { securityFieldGuide } from "./security-field-guide.js";
import { toolImageFiles } from "./tool-image-map.js";
import {
    additionalToolTranslations,
    blackArchTranslations,
    distributionTranslations,
    toolLearningTranslations,
} from "./tool-localizations.js";

const SUPABASE_URL = "https://ddkqqauzhzeqnrvjguxh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRka3FxYXV6aHplcW5ydmpndXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MDkzOTAsImV4cCI6MjEwODM4NTM5MH0.chVjshiDlQRDoEIdCvTLNCIvPStxKw-7EDEU8LmdYFQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const statusElement = document.querySelector("#status");
const authCard = document.querySelector("#auth-card");
const dashboard = document.querySelector("#dashboard");
const publicTools = document.querySelector("#public-tools");
const accountNavigation = document.querySelector("#account-navigation");
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

function updateAccountNavigation() {
    accountNavigation.hidden = !currentUser;
    accountNavigation.textContent = publicTools.hidden ? "Kali tools" : "My notes";
}

function showPublicTools() {
    authCard.hidden = true;
    dashboard.hidden = true;
    publicTools.hidden = false;
    clearStatus();
    updateAccountNavigation();
}

function showAuthView(name) {
    authViews.forEach((view) => {
        view.hidden = view.id !== `auth-${name}`;
    });
    authCard.hidden = false;
    dashboard.hidden = true;
    publicTools.hidden = true;
    clearStatus();
    updateAccountNavigation();
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
    publicTools.hidden = true;
    updateAccountNavigation();
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

accountNavigation.addEventListener("click", () => {
    if (publicTools.hidden) {
        showPublicTools();
    } else if (currentUser) {
        showDashboard(currentUser).catch(showError);
    } else {
        showAuthView("login");
    }
});

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
        const username = String(form.get("username")).trim();
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
        showPublicTools();
        showStatus("You are signed out.");
    });
});

const toolSearch = document.querySelector("#tool-search");
const toolCategory = document.querySelector("#tool-category");
const toolCards = document.querySelector("#tool-cards");
const toolCount = document.querySelector("#tool-count");
const toolDistribution = document.querySelector("#tool-distribution");
const toolLanguage = document.querySelector("#tool-language");
const toolLibraryHome = document.querySelector("#tool-library-home");
const toolDetail = document.querySelector("#tool-detail");
const securityGuideSearch = document.querySelector("#security-guide-search");
const securityGuideCount = document.querySelector("#security-guide-count");
const securityGuideCategories = document.querySelector("#security-guide-categories");
const toolImageDirectory = "./image/tool-logos-2k/";
const toolPurposeSummaries = {
    en: {
        "network-protocol": "Checks or analyzes network protocols and connected devices for troubleshooting and authorized inventory.",
        "network-traffic": "Captures or reviews network traffic to support troubleshooting and defensive monitoring.",
        "digital-forensics": "Helps examine digital evidence, file systems, or storage media during an authorized investigation.",
        "malware-analysis": "Supports defensive identification and analysis of suspicious files or system indicators.",
        "wireless-security": "Helps review wireless technologies and configurations in an authorized security assessment.",
        "credential-audit": "Supports authorized assessment of passwords, credential artifacts, or authentication controls.",
        "web-security": "Helps assess websites and web applications for security issues in an authorized test environment.",
        "domain-intelligence": "Collects or analyzes domain and DNS information for authorized asset inventory and research.",
        "network-inventory": "Helps discover and document approved hosts, services, or network assets.",
        "software-testing": "Tests software behavior and robustness in a controlled development or security-testing environment.",
        "reverse-engineering": "Helps inspect software, binaries, or applications to understand their structure and behavior.",
        "remote-access": "Supports administration or security review of remote-access services you are authorized to manage.",
        "data-recovery": "Helps recover or inspect data from files and storage media during authorized maintenance or investigations.",
        "security-platform": "Provides a platform for organizing, tracking, or reporting authorized security assessments.",
        "development-tools": "Supports software development, debugging, or the preparation of controlled test materials.",
        "system-audit": "Audits local systems or configurations to help identify security-hardening opportunities.",
        "osint-research": "Organizes publicly available information for documented, authorized security research.",
        "service-control": "Manages a supporting security or training service in an environment you administer.",
        "identity-mapping": "Helps visualize identity and access relationships for authorized security reviews.",
        "controlled-simulation": "Supports controlled security research and validation of defensive controls in an isolated, authorized lab.",
        "credential-strength": "Helps teams evaluate password-policy strength using authorized, controlled test data.",
        "crypto-tools": "Supports analysis or use of encryption and cryptographic data for authorized security work.",
        "network-file-service": "Supports inspection or administration of network file-sharing services you are authorized to manage.",
        "cloud-identity": "Helps inventory cloud identity relationships in an account you are authorized to review.",
        "wireless-radio": "Supports configuration and analysis of radio or wireless communications equipment.",
        "vulnerability-assessment": "Helps identify and document potential security weaknesses during an authorized assessment.",
        "secure-communications": "Provides secure communication or tunneling capabilities for approved administration and testing.",
        "privacy": "Supports privacy, anonymity, or data-protection tasks in a controlled and lawful setting.",
        "category-reconnaissance": "Helps map approved assets and gather information for inventory and exposure review.",
        "category-resource-development": "Helps create, inspect, or test software and research artifacts.",
        "category-initial-access": "Helps security teams study entry-point protections in an authorized test environment.",
        "category-execution": "Supports controlled software-execution testing and defensive validation.",
        "category-persistence": "Supports defensive study of persistence risks and controls in isolated test environments.",
        "category-privilege-escalation": "Helps audit privilege boundaries on systems you are authorized to assess.",
        "category-defense-evasion": "Helps defenders assess detection coverage in a controlled test environment.",
        "category-credential-access": "Supports authorized review of credential and authentication security.",
        "category-discovery": "Helps find and catalog approved systems, services, or configuration data.",
        "category-lateral-movement": "Supports defensive study of internal access controls in an authorized lab.",
        "category-collection": "Helps collect or organize authorized data for investigation and defensive review.",
        "category-command-and-control": "Supports controlled research into command-channel risks and defensive detection.",
        "category-exfiltration": "Helps assess data-loss controls using synthetic data in an isolated lab.",
        "category-impact": "Helps model availability or integrity risks safely in an isolated test environment.",
        "category-forensics": "Helps examine digital evidence and storage media during authorized investigations.",
        "category-services-and-other-tools": "Provides supporting lab, documentation, or security-management functions.",
    },
    km: {
        "network-protocol": "ពិនិត្យពិធីការបណ្ដាញ និងឧបករណ៍ដែលបានភ្ជាប់ សម្រាប់ដោះស្រាយបញ្ហា និងរៀបចំបញ្ជីដោយមានការអនុញ្ញាត។",
        "network-traffic": "ចាប់យក ឬពិនិត្យចរាចរណ៍បណ្ដាញ ដើម្បីដោះស្រាយបញ្ហា និងតាមដានការការពារ។",
        "digital-forensics": "ជួយពិនិត្យភស្តុតាងឌីជីថល ប្រព័ន្ធឯកសារ ឬឧបករណ៍ផ្ទុក ក្នុងការស៊ើបអង្កេតដែលមានការអនុញ្ញាត។",
        "malware-analysis": "ជួយកំណត់អត្តសញ្ញាណ និងវិភាគឯកសារគួរឱ្យសង្ស័យ ឬសញ្ញាប្រព័ន្ធ សម្រាប់ការពារ។",
        "wireless-security": "ជួយពិនិត្យបច្ចេកវិទ្យា និងការកំណត់រចនាសម្ព័ន្ធឥតខ្សែ ក្នុងការវាយតម្លៃសុវត្ថិភាពដែលមានការអនុញ្ញាត។",
        "credential-audit": "ជួយវាយតម្លៃពាក្យសម្ងាត់ ព័ត៌មានសម្គាល់ ឬការគ្រប់គ្រងការផ្ទៀងផ្ទាត់ ក្នុងការធ្វើតេស្តដែលមានការអនុញ្ញាត។",
        "web-security": "ជួយវាយតម្លៃគេហទំព័រ និងកម្មវិធីបណ្ដាញ ក្នុងបរិស្ថានធ្វើតេស្តដែលមានការអនុញ្ញាត។",
        "domain-intelligence": "ប្រមូល ឬវិភាគព័ត៌មាន domain និង DNS សម្រាប់រៀបចំបញ្ជីទ្រព្យសម្បត្តិដែលមានការអនុញ្ញាត។",
        "network-inventory": "ជួយស្វែងរក និងកត់ត្រាម៉ាស៊ីន សេវាកម្ម ឬទ្រព្យសម្បត្តិបណ្ដាញដែលបានអនុញ្ញាត។",
        "software-testing": "ធ្វើតេស្តឥរិយាបថ និងភាពរឹងមាំរបស់កម្មវិធី ក្នុងបរិស្ថានអភិវឌ្ឍន៍ ឬសុវត្ថិភាពដែលបានគ្រប់គ្រង។",
        "reverse-engineering": "ជួយពិនិត្យកម្មវិធី ឯកសារប្រតិបត្តិ ឬកម្មវិធីផ្សេងៗ ដើម្បីយល់ពីរចនាសម្ព័ន្ធ និងឥរិយាបថ។",
        "remote-access": "ជួយគ្រប់គ្រង ឬពិនិត្យសេវាចូលប្រើពីចម្ងាយដែលអ្នកមានសិទ្ធិគ្រប់គ្រង។",
        "data-recovery": "ជួយស្ដារ ឬពិនិត្យទិន្នន័យពីឯកសារ និងឧបករណ៍ផ្ទុក សម្រាប់ការថែទាំ ឬស៊ើបអង្កេតដែលមានការអនុញ្ញាត។",
        "security-platform": "ផ្ដល់វេទិកាសម្រាប់រៀបចំ តាមដាន ឬរាយការណ៍ការវាយតម្លៃសុវត្ថិភាពដែលមានការអនុញ្ញាត។",
        "development-tools": "ជួយអភិវឌ្ឍកម្មវិធី ដោះស្រាយបញ្ហាកូដ ឬរៀបចំសម្ភារៈធ្វើតេស្តដែលបានគ្រប់គ្រង។",
        "system-audit": "ធ្វើសវនកម្មប្រព័ន្ធ ឬការកំណត់រចនាសម្ព័ន្ធ ដើម្បីស្វែងរកចំណុចពង្រឹងសុវត្ថិភាព។",
        "osint-research": "រៀបចំព័ត៌មានសាធារណៈសម្រាប់ការស្រាវជ្រាវសុវត្ថិភាពដែលមានឯកសារ និងការអនុញ្ញាត។",
        "service-control": "គ្រប់គ្រងសេវាគាំទ្រផ្នែកសុវត្ថិភាព ឬការបណ្ដុះបណ្ដាល ក្នុងបរិស្ថានដែលអ្នកគ្រប់គ្រង។",
        "identity-mapping": "ជួយបង្ហាញទំនាក់ទំនងអត្តសញ្ញាណ និងសិទ្ធិចូលប្រើ សម្រាប់ការពិនិត្យដែលមានការអនុញ្ញាត។",
        "controlled-simulation": "ជួយស្រាវជ្រាវសុវត្ថិភាព និងផ្ទៀងផ្ទាត់វិធានការការពារ ក្នុងមន្ទីរពិសោធន៍ដាច់ដោយឡែកដែលមានការអនុញ្ញាត។",
        "credential-strength": "ជួយវាយតម្លៃភាពរឹងមាំនៃគោលការណ៍ពាក្យសម្ងាត់ ដោយប្រើទិន្នន័យធ្វើតេស្តដែលបានអនុញ្ញាត។",
        "crypto-tools": "ជួយវិភាគ ឬប្រើទិន្នន័យគ្រីបតូ សម្រាប់ការងារសុវត្ថិភាពដែលមានការអនុញ្ញាត។",
        "network-file-service": "ជួយពិនិត្យ ឬគ្រប់គ្រងសេវាចែករំលែកឯកសារបណ្ដាញដែលអ្នកមានសិទ្ធិគ្រប់គ្រង។",
        "cloud-identity": "ជួយរៀបចំបញ្ជីទំនាក់ទំនងអត្តសញ្ញាណ cloud ក្នុងគណនីដែលអ្នកមានសិទ្ធិពិនិត្យ។",
        "wireless-radio": "ជួយកំណត់រចនាសម្ព័ន្ធ និងវិភាគឧបករណ៍ទំនាក់ទំនងវិទ្យុ ឬឥតខ្សែ។",
        "vulnerability-assessment": "ជួយស្វែងរក និងកត់ត្រាចំណុចខ្សោយសុវត្ថិភាព ក្នុងការវាយតម្លៃដែលមានការអនុញ្ញាត។",
        "secure-communications": "ផ្ដល់មុខងារទំនាក់ទំនង ឬផ្លូវរូងសុវត្ថិភាព សម្រាប់ការគ្រប់គ្រង និងធ្វើតេស្តដែលបានអនុម័ត។",
        "privacy": "ជួយការងារឯកជនភាព ភាពអនាមិក ឬការការពារទិន្នន័យ ក្នុងបរិស្ថានដែលស្របច្បាប់។",
        "category-reconnaissance": "ជួយគូសផែនទីទ្រព្យសម្បត្តិដែលបានអនុញ្ញាត និងប្រមូលព័ត៌មានសម្រាប់ពិនិត្យការបង្ហាញហានិភ័យ។",
        "category-resource-development": "ជួយបង្កើត ពិនិត្យ ឬធ្វើតេស្តកម្មវិធី និងសម្ភារៈស្រាវជ្រាវ។",
        "category-initial-access": "ជួយក្រុមសុវត្ថិភាពសិក្សាការការពារចំណុចចូល ក្នុងបរិស្ថានធ្វើតេស្តដែលមានការអនុញ្ញាត។",
        "category-execution": "ជួយធ្វើតេស្តការប្រតិបត្តិកម្មវិធី និងការការពារ ក្នុងបរិស្ថានដែលបានគ្រប់គ្រង។",
        "category-persistence": "ជួយសិក្សាហានិភ័យ និងវិធានការការពារការបន្តសកម្មភាព ក្នុងបរិស្ថានសាកល្បងដាច់ដោយឡែក។",
        "category-privilege-escalation": "ជួយធ្វើសវនកម្មព្រំដែនសិទ្ធិលើប្រព័ន្ធដែលអ្នកមានសិទ្ធិពិនិត្យ។",
        "category-defense-evasion": "ជួយអ្នកការពារវាយតម្លៃការគ្របដណ្ដប់នៃការរកឃើញ ក្នុងបរិស្ថានធ្វើតេស្តដែលបានគ្រប់គ្រង។",
        "category-credential-access": "ជួយពិនិត្យសុវត្ថិភាពព័ត៌មានសម្គាល់ និងការផ្ទៀងផ្ទាត់ ដោយមានការអនុញ្ញាត។",
        "category-discovery": "ជួយស្វែងរក និងកត់ត្រាប្រព័ន្ធ សេវាកម្ម ឬទិន្នន័យការកំណត់រចនាសម្ព័ន្ធដែលបានអនុញ្ញាត។",
        "category-lateral-movement": "ជួយសិក្សាវិធានការគ្រប់គ្រងការចូលប្រើខាងក្នុង ក្នុងមន្ទីរពិសោធន៍ដែលមានការអនុញ្ញាត។",
        "category-collection": "ជួយប្រមូល ឬរៀបចំទិន្នន័យដែលមានការអនុញ្ញាត សម្រាប់ស៊ើបអង្កេត និងពិនិត្យការការពារ។",
        "category-command-and-control": "ជួយស្រាវជ្រាវហានិភ័យបណ្ដាញបញ្ជា និងការរកឃើញការការពារ ក្នុងបរិស្ថានសាកល្បង។",
        "category-exfiltration": "ជួយវាយតម្លៃការគ្រប់គ្រងការបាត់បង់ទិន្នន័យ ដោយប្រើទិន្នន័យសិប្បនិម្មិតក្នុងមន្ទីរពិសោធន៍។",
        "category-impact": "ជួយសិក្សាហានិភ័យលើភាពអាចប្រើបាន និងភាពត្រឹមត្រូវ ក្នុងបរិស្ថានសាកល្បងដាច់ដោយឡែក។",
        "category-forensics": "ជួយពិនិត្យភស្តុតាងឌីជីថល និងឧបករណ៍ផ្ទុក ក្នុងការស៊ើបអង្កេតដែលមានការអនុញ្ញាត។",
        "category-services-and-other-tools": "ផ្ដល់មុខងារគាំទ្រមន្ទីរពិសោធន៍ ឯកសារ ឬការគ្រប់គ្រងសុវត្ថិភាព។",
    },
};
const normalizeToolImageKey = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const kaliToolCatalog = toolIndex.map((tool) => {
    const profile = safeToolProfiles[normalizeToolImageKey(tool.name)];
    const imageFile = toolImageFiles[normalizeToolImageKey(tool.name)]
        || toolImageFiles[normalizeToolImageKey(tool.slug)]
        || toolImageFiles.toolsiconmissing;
    const purposeKey = tool.purposeKey || `category-${tool.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return {
        ...tool,
        ...profile,
        distribution: "kali",
        packageName: profile?.packageName || tool.slug,
        kaliUrl: profile?.kaliUrl || `https://www.kali.org/tools/${encodeURIComponent(tool.slug)}/`,
        summary: profile?.summary || toolPurposeSummaries.en[purposeKey],
        summaryKm: profile?.summaryKm || toolPurposeSummaries.km[purposeKey],
        imageFile,
    };
});
const blackArchToolCatalog = blackArchIndex.map((tool) => ({
    ...tool,
    slug: tool.name,
    packageName: tool.name,
    distribution: "blackarch",
    categoryUrl: `https://blackarch.org/${tool.categoryPath}`,
    icon: "audit",
    imageFile: null,
}));
const baseToolTranslations = {
    en: {
        title: "Kali tool library",
        language: "Language",
        description: "Browse 501 Kali tools with short purpose summaries, categories, and official documentation links. Selected tools also include safe local or offline demos.",
        source: "Open the official Kali tools index",
        artworkNote: "Tool artwork is shown for identification and links to its Kali documentation. NiNJa GO is an independent project and is not affiliated with Kali Linux.",
        usageGuideTitle: "How to use this library safely",
        usageStepsTitle: "How to use the library",
        usageSteps: [
            "Search by tool name or filter by category.",
            "Choose View details to read the purpose and any available safe example.",
            "Open the official Kali documentation to check requirements, limitations, and current instructions.",
            "Practice only in an isolated lab that you own or are explicitly authorized to use.",
        ],
        safetyTitle: "Permission and protection checklist",
        safetySteps: [
            "Get clear permission and define the approved systems and scope before testing.",
            "Use a separate, isolated lab; avoid production systems, other people's accounts, and real sensitive data.",
            "Keep security controls enabled, use least privilege, and back up important lab data.",
            "Examples are informational text only. This site never runs tools, scans targets, or verifies that you have permission.",
        ],
        safetyConfirmation: "Use a tool only when you have authorization and can protect the systems and data involved.",
        search: "Search tools",
        searchPlaceholder: "Search by tool name or category",
        category: "Filter by category",
        allCategories: "All categories",
        install: "Install on Kali Linux",
        copyExample: "Copy example",
        copiedFallback: "Could not copy the command. Select and copy it instead.",
        official: "Kali documentation",
        viewProfile: "View details",
        count: (number) => `${number} ${number === 1 ? "tool" : "tools"}`,
        noResults: "No tools match your search. Try another name or category.",
        back: "Back to tool library",
        tabsLabel: "Tool profile sections",
        profileTabs: ["Overview", "Safe example", "Package & links"],
        profileSummary: "What this tool is used for",
        profileUse: "Typical defensive use",
        ...toolLearningTranslations.en,
        usePermission: "Only run tools on systems and data you own or are explicitly authorized to assess. Commands are examples only; this website never executes them.",
        exampleTitle: "Example command",
        packageTitle: "Kali package",
        profileInstallTitle: "Install command",
        kaliReference: "Kali tool profile",
        copy: "Copy",
        copyFeedback: "{name} example copied.",
        exampleNote: "Use only in an isolated lab with explicit authorization.",
    },
    km: {
        title: "បណ្ណាល័យឧបករណ៍ Kali",
        language: "ភាសា",
        description: "រកមើលឧបករណ៍ Kali ចំនួន ៥០១ ជាមួយសេចក្ដីសង្ខេបពីគោលបំណង ប្រភេទ និងតំណទៅឯកសារផ្លូវការ។ ឧបករណ៍មួយចំនួនមានឧទាហរណ៍សុវត្ថិភាពក្នុងម៉ាស៊ីន ឬក្រៅបណ្ដាញ។",
        source: "បើកបញ្ជីឧបករណ៍ផ្លូវការរបស់ Kali",
        artworkNote: "រូបតំណាងឧបករណ៍ប្រើសម្រាប់កំណត់អត្តសញ្ញាណ និងមានតំណទៅឯកសារ Kali។ NiNJa GO ជាគម្រោងឯករាជ្យ និងមិនមានទំនាក់ទំនងជាមួយ Kali Linux ទេ។",
        usageGuideTitle: "របៀបប្រើបណ្ណាល័យនេះដោយសុវត្ថិភាព",
        usageStepsTitle: "របៀបប្រើបណ្ណាល័យ",
        usageSteps: [
            "ស្វែងរកតាមឈ្មោះឧបករណ៍ ឬត្រងតាមប្រភេទ។",
            "ជ្រើសរើស មើលព័ត៌មាន ដើម្បីអានគោលបំណង និងឧទាហរណ៍សុវត្ថិភាពដែលមាន។",
            "បើកឯកសារផ្លូវការរបស់ Kali ដើម្បីពិនិត្យតម្រូវការ ដែនកំណត់ និងការណែនាំបច្ចុប្បន្ន។",
            "សាកល្បងតែក្នុងមន្ទីរពិសោធន៍ដាច់ដោយឡែកដែលជាកម្មសិទ្ធិរបស់អ្នក ឬអ្នកមានការអនុញ្ញាតច្បាស់លាស់។",
        ],
        safetyTitle: "បញ្ជីត្រួតពិនិត្យការអនុញ្ញាត និងការការពារ",
        safetySteps: [
            "ទទួលបានការអនុញ្ញាតច្បាស់លាស់ និងកំណត់ប្រព័ន្ធនិងវិសាលភាពដែលអនុញ្ញាតមុនពេលសាកល្បង។",
            "ប្រើមន្ទីរពិសោធន៍ដាច់ដោយឡែក។ ជៀសវាងប្រព័ន្ធផលិតកម្ម គណនីអ្នកដទៃ និងទិន្នន័យរសើបពិតប្រាកដ។",
            "បើកការការពារសុវត្ថិភាពជានិច្ច ប្រើសិទ្ធិតិចបំផុតតាមតម្រូវការ និងបម្រុងទុកទិន្នន័យមន្ទីរពិសោធន៍សំខាន់ៗ។",
            "ឧទាហរណ៍គ្រាន់តែជាអត្ថបទព័ត៌មានប៉ុណ្ណោះ។ គេហទំព័រនេះមិនដំណើរការឧបករណ៍ មិនស្កេនគោលដៅ និងមិនផ្ទៀងផ្ទាត់ការអនុញ្ញាតរបស់អ្នកទេ។",
        ],
        safetyConfirmation: "ប្រើឧបករណ៍តែនៅពេលអ្នកមានការអនុញ្ញាត និងអាចការពារប្រព័ន្ធនិងទិន្នន័យដែលពាក់ព័ន្ធបានប៉ុណ្ណោះ។",
        search: "ស្វែងរកឧបករណ៍",
        searchPlaceholder: "ស្វែងរកតាមឈ្មោះឧបករណ៍ ឬប្រភេទ",
        category: "ត្រងតាមប្រភេទ",
        allCategories: "គ្រប់ប្រភេទ",
        install: "ដំឡើងលើ Kali Linux",
        copyExample: "ចម្លងឧទាហរណ៍",
        copiedFallback: "មិនអាចចម្លងពាក្យបញ្ជាបានទេ។ សូមជ្រើសរើស ហើយចម្លងវាដោយដៃ។",
        official: "ឯកសារ Kali",
        viewProfile: "មើលព័ត៌មាន",
        count: (number) => `ឧបករណ៍ ${number}`,
        noResults: "រកមិនឃើញឧបករណ៍ដែលត្រូវនឹងការស្វែងរកទេ។ សូមសាកល្បងឈ្មោះ ឬប្រភេទផ្សេង។",
        back: "ត្រឡប់ទៅបណ្ណាល័យឧបករណ៍",
        tabsLabel: "ផ្នែកព័ត៌មានឧបករណ៍",
        profileTabs: ["ទិដ្ឋភាពទូទៅ", "ឧទាហរណ៍សុវត្ថិភាព", "កញ្ចប់ និងតំណ"],
        profileSummary: "ការប្រើប្រាស់ឧបករណ៍នេះ",
        profileUse: "ការប្រើប្រាស់ផ្នែកការពារទូទៅ",
        ...toolLearningTranslations.km,
        usePermission: "ដំណើរការឧបករណ៍តែលើប្រព័ន្ធ និងទិន្នន័យដែលជាកម្មសិទ្ធិរបស់អ្នក ឬដែលអ្នកមានការអនុញ្ញាតច្បាស់លាស់ឱ្យវាយតម្លៃប៉ុណ្ណោះ។ ពាក្យបញ្ជាគ្រាន់តែជាឧទាហរណ៍ គេហទំព័រនេះមិនដំណើរការពាក្យបញ្ជាទេ។",
        exampleTitle: "ពាក្យបញ្ជាឧទាហរណ៍",
        packageTitle: "កញ្ចប់ Kali",
        profileInstallTitle: "ពាក្យបញ្ជាដំឡើង",
        kaliReference: "ព័ត៌មានឧបករណ៍ Kali",
        copy: "ចម្លង",
        copyFeedback: "បានចម្លងឧទាហរណ៍ {name}។",
        exampleNote: "ប្រើតែក្នុងមន្ទីរពិសោធន៍ដាច់ដោយឡែកដែលមានការអនុញ្ញាតច្បាស់លាស់។",
    },
};
const toolTranslations = { ...baseToolTranslations, ...additionalToolTranslations };

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
        image.src = `${toolImageDirectory}${encodeURIComponent(imageFile.replace(/\.svg$/i, ".webp"))}`;
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

const supportedToolLanguages = new Set(Object.keys(toolTranslations));
const savedToolLanguage = localStorage.getItem("mengkhong-tool-language");
let toolPageLanguage = supportedToolLanguages.has(savedToolLanguage) ? savedToolLanguage : "en";
toolLanguage.value = toolPageLanguage;
const supportedDistributions = new Set(["kali", "blackarch"]);
const savedDistribution = localStorage.getItem("mengkhong-tool-distribution");
let activeDistribution = supportedDistributions.has(savedDistribution) ? savedDistribution : "kali";
toolDistribution.value = activeDistribution;
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
    if (activeDistribution === "blackarch") {
        return category.replace(/^blackarch-/, "").split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }
    return activeToolTranslation().categoryNames?.[category]
        || (toolPageLanguage === "km" ? toolCategoryNamesKm[category] : category)
        || category;
}

function localizedToolSummary(tool) {
    if (tool.distribution === "blackarch") {
        const text = distributionTranslations[toolPageLanguage].blackArch;
        return text.packageSummary
            .replace("{name}", tool.name)
            .replace("{category}", localizedToolCategory(tool.category))
            .replace("{version}", tool.version);
    }
    if (toolPageLanguage === "en") return tool.summary;
    if (toolPageLanguage === "km") return tool.summaryKm;
    return activeToolTranslation().categorySummaries?.[tool.category] || tool.summary;
}

function activeToolTranslation() {
    return toolTranslations[toolPageLanguage];
}

function activeToolCatalog() {
    return activeDistribution === "blackarch" ? blackArchToolCatalog : kaliToolCatalog;
}

function renderToolCategoryOptions() {
    const text = activeToolTranslation();
    const categories = [...new Set(activeToolCatalog().map((tool) => tool.category))]
        .sort((left, right) => localizedToolCategory(left).localeCompare(localizedToolCategory(right)));
    toolCategory.replaceChildren(new Option(text.allCategories, ""));
    for (const category of categories) {
        toolCategory.add(new Option(localizedToolCategory(category), category));
    }
}

function localizeToolLibrary() {
    const text = activeToolTranslation();
    const distributionText = distributionTranslations[toolPageLanguage];
    const isBlackArch = activeDistribution === "blackarch";
    const catalogText = isBlackArch ? distributionText.blackArch : text;
    document.querySelector("#tool-library").lang = toolPageLanguage;
    document.querySelector("#tool-library").dir = toolPageLanguage === "ar" ? "rtl" : "ltr";
    document.querySelector("#public-tools").setAttribute("aria-label", catalogText.title);
    document.querySelector("#tool-library-title").textContent = catalogText.title;
    document.querySelector("#tool-distribution-label").textContent = distributionText.selectorLabel;
    toolDistribution.setAttribute("aria-label", distributionText.selectorLabel);
    toolDistribution.options[0].textContent = distributionText.kaliOption;
    toolDistribution.options[1].textContent = distributionText.blackArchOption;
    document.querySelector("#tool-language-label").textContent = text.language;
    document.querySelector("#tool-library-description").textContent = catalogText.description;
    const sourceLink = document.querySelector("#tool-index-source");
    sourceLink.textContent = catalogText.source;
    sourceLink.href = isBlackArch ? catalogText.sourceUrl : "https://www.kali.org/tools/";
    document.querySelector("#blackarch-feature").hidden = isBlackArch;
    const blackArch = blackArchTranslations[toolPageLanguage] || blackArchTranslations.en;
    document.querySelector("#blackarch-feature").setAttribute("aria-label", blackArch.label);
    document.querySelector("#blackarch-logo").alt = blackArch.logoAlt;
    document.querySelector("#blackarch-description").textContent = blackArch.description;
    document.querySelector("#blackarch-site-link").textContent = blackArch.site;
    document.querySelector("#blackarch-tools-link").textContent = blackArch.tools;
    document.querySelector("#tool-artwork-note").textContent = text.artworkNote;
    document.querySelector("#tool-usage-guide-title").textContent = text.usageGuideTitle;
    document.querySelector("#tool-usage-steps-title").textContent = text.usageStepsTitle;
    for (const [index, step] of text.usageSteps.entries()) {
        document.querySelector(`#tool-usage-step-${["search", "details", "docs", "learn"][index]}`).textContent = step;
    }
    document.querySelector("#tool-safety-title").textContent = text.safetyTitle;
    for (const [index, step] of text.safetySteps.entries()) {
        document.querySelector(`#tool-safety-${["permission", "lab", "controls", "examples"][index]}`).textContent = step;
    }
    document.querySelector("#tool-safety-confirmation").textContent = text.safetyConfirmation;
    document.querySelector("#tool-search-label").textContent = text.search;
    toolSearch.placeholder = text.searchPlaceholder;
    document.querySelector("#tool-category-label").textContent = text.category;
    renderToolCategoryOptions();
    renderToolCatalog();
}

function renderToolCatalog() {
    const text = activeToolTranslation();
    const query = toolSearch.value.trim().toLowerCase();
    const category = toolCategory.value;
    const filteredTools = activeToolCatalog().filter((tool) => {
        const matchesCategory = !category || tool.category === category;
        const searchableText = `${tool.name} ${tool.slug} ${tool.packageName} ${tool.version || ""} ${tool.category} ${localizedToolCategory(tool.category)}`.toLowerCase();
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
        ([left], [right]) => {
            const leftIndex = toolCategoryOrder.indexOf(left);
            const rightIndex = toolCategoryOrder.indexOf(right);
            if (leftIndex !== -1 && rightIndex !== -1) return leftIndex - rightIndex;
            return localizedToolCategory(left).localeCompare(localizedToolCategory(right));
        },
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
            officialLink.href = tool.distribution === "blackarch"
                ? tool.categoryUrl
                : `https://www.kali.org/tools/${encodeURIComponent(tool.slug)}/`;
            officialLink.target = "_blank";
            officialLink.rel = "noopener noreferrer";
            officialLink.textContent = tool.name;
            item.append(icon, officialLink);
            const profileButton = document.createElement("button");
            profileButton.type = "button";
            profileButton.className = "tool-profile-link";
            profileButton.textContent = text.viewProfile;
            profileButton.addEventListener("click", () => openToolProfile(tool));
            item.append(profileButton);
            list.append(item);
        }

        section.append(heading, list);
        toolCards.append(section);
    }
}

function renderSecurityFieldGuide() {
    securityGuideCategories.replaceChildren();
    for (const category of securityFieldGuide) {
        const section = document.createElement("details");
        section.className = "security-guide-category";
        const heading = document.createElement("summary");
        heading.textContent = `${category.category} (${category.tools.length})`;
        const safety = document.createElement("p");
        safety.className = "security-guide-safety";
        safety.textContent = category.safePractice;
        const list = document.createElement("ul");
        list.className = "security-guide-list";
        for (const tool of category.tools) {
            const item = document.createElement("li");
            item.className = "security-guide-item";
            item.dataset.searchText = `${category.category} ${tool.name} ${tool.summary} ${tool.focus} ${tool.quickStart.text}`.toLowerCase();
            const name = document.createElement("h3");
            name.textContent = tool.name;
            const summary = document.createElement("p");
            summary.textContent = tool.summary;
            const focus = document.createElement("p");
            focus.className = "security-guide-focus";
            focus.textContent = `Safe learning focus: ${tool.focus}`;
            item.append(name, summary, focus);
            if (tool.quickStart.type === "command" || tool.quickStart.type === "launch") {
                addCopyableCommand(
                    item,
                    tool,
                    tool.quickStart.text,
                    tool.quickStart.label,
                    tool.quickStart.note,
                );
            } else {
                const reference = document.createElement("p");
                reference.className = "security-guide-focus";
                reference.textContent = `${tool.quickStart.label}: ${tool.quickStart.text} ${tool.quickStart.note}`;
                item.append(reference);
            }
            const more = document.createElement("details");
            more.className = "security-guide-more";
            const moreSummary = document.createElement("summary");
            moreSummary.textContent = "Installation, explanation & safe use";
            const moreContent = document.createElement("div");
            moreContent.className = "security-guide-more-content";
            const details = document.createElement("p");
            details.textContent = tool.details;
            const safeUse = document.createElement("p");
            safeUse.textContent = `How to learn safely: ${tool.safeUse}`;
            const install = document.createElement("p");
            install.textContent = "Installation: Follow the official project instructions for your operating system and version. Check prerequisites, licensing, and integrity instructions before installing. Kali and BlackArch packages may differ from upstream instructions.";
            const links = document.createElement("div");
            links.className = "security-guide-links";
            for (const [label, url] of [
                ["Official download / project page", tool.installUrl],
                ["Official documentation and usage", tool.docsUrl],
            ]) {
                const link = document.createElement("a");
                link.href = url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = label;
                links.append(link);
            }
            moreContent.append(details, safeUse, install, links);
            more.append(moreSummary, moreContent);
            item.append(more);
            list.append(item);
        }
        section.append(heading, safety, list);
        securityGuideCategories.append(section);
    }
    filterSecurityFieldGuide();
}

function filterSecurityFieldGuide() {
    const query = securityGuideSearch.value.trim().toLowerCase();
    let visibleCount = 0;
    for (const category of securityGuideCategories.children) {
        let categoryCount = 0;
        for (const item of category.querySelectorAll(".security-guide-item")) {
            const matches = item.dataset.searchText.includes(query);
            item.hidden = !matches;
            if (matches) categoryCount += 1;
        }
        category.hidden = categoryCount === 0;
        category.open = Boolean(query) && categoryCount > 0;
        visibleCount += categoryCount;
    }
    securityGuideCount.textContent = query
        ? `${visibleCount} matching ${visibleCount === 1 ? "tool" : "tools"}`
        : `${visibleCount} tools across ${securityFieldGuide.length} categories`;
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
            showStatus(activeToolTranslation().copyFeedback.replace("{name}", tool.name));
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
    const distributionText = distributionTranslations[toolPageLanguage];
    const isBlackArch = tool.distribution === "blackarch";
    const learning = toolLearningTranslations[toolPageLanguage] || toolLearningTranslations.en;
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
    subtitle.textContent = localizedToolSummary(tool);
    const meta = document.createElement("div");
    meta.className = "tool-meta";
    for (const label of [
        localizedToolCategory(tool.category),
        `${isBlackArch ? distributionText.blackArch.packageLabel : text.packageTitle}: ${tool.packageName}`,
        ...(tool.version ? [`${distributionText.blackArch.versionLabel}: ${tool.version}`] : []),
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
    const tabNames = tool.command
        ? ["overview", "example", "package"]
        : ["overview", "package"];
    const tabLabels = tool.command
        ? text.profileTabs
        : [text.profileTabs[0], text.profileTabs[2]];
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
        tab.textContent = tabLabels[index];
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
        localizedToolSummary(tool),
    );
    const useDescription = toolPageLanguage === "km"
        ? tool.commandDescriptionKm || tool.commandDescription
    : toolPageLanguage === "en" ? tool.commandDescription : undefined;
    if (useDescription) {
        appendDetailBlock(overview, text.profileUse, useDescription);
    }
    const authorizationNote = document.createElement("p");
    authorizationNote.className = "status";
    authorizationNote.textContent = text.usePermission;
    overview.append(authorizationNote);
    appendDetailBlock(
        overview,
        isBlackArch ? distributionText.blackArch.learnTitle : text.learnTitle,
        "",
    );
    const learningSteps = document.createElement("ol");
    const learningStepTexts = [...learning.learnSteps];
    if (isBlackArch) learningStepTexts[0] = distributionText.blackArch.firstLearnStep;
    for (const step of learningStepTexts) {
        const item = document.createElement("li");
        item.textContent = step;
        learningSteps.append(item);
    }
    overview.append(learningSteps);

    const exampleIndex = tabNames.indexOf("example");
    if (exampleIndex !== -1) {
        const example = panels[exampleIndex];
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
                toolPageLanguage === "km"
                    ? exampleItem.labelKm || exampleItem.label
                    : toolPageLanguage === "en" ? exampleItem.label : text.exampleTitle,
                toolPageLanguage === "km"
                    ? exampleItem.descriptionKm || exampleItem.description
                    : toolPageLanguage === "en" ? exampleItem.description : text.exampleNote,
            );
        }
    }

    const packageInfo = panels[tabNames.indexOf("package")];
    appendDetailBlock(
        packageInfo,
        isBlackArch ? distributionText.blackArch.installTitle : learning.installTitle,
        isBlackArch ? distributionText.blackArch.installDescription : learning.installDescription,
    );
    const updateLabel = document.createElement("span");
    updateLabel.className = "tool-command-label";
    updateLabel.textContent = isBlackArch
        ? distributionText.blackArch.updateLabel
        : learning.updateLabel;
    const updateCommand = document.createElement("code");
    updateCommand.className = "tool-command";
    updateCommand.textContent = isBlackArch ? "sudo pacman -Syu" : "sudo apt update";
    packageInfo.append(updateLabel, updateCommand);
    const installLabel = document.createElement("span");
    installLabel.className = "tool-command-label";
    installLabel.textContent = isBlackArch
        ? distributionText.blackArch.installLabel
        : learning.installLabel;
    const installCommand = document.createElement("code");
    installCommand.className = "tool-command";
    installCommand.textContent = isBlackArch
        ? `sudo pacman -S ${tool.packageName}`
        : `sudo apt install ${tool.packageName}`;
    const installNote = document.createElement("p");
    installNote.textContent = isBlackArch
        ? distributionText.blackArch.installNote
        : learning.installNote;
    packageInfo.append(installLabel, installCommand, installNote);
    appendDetailBlock(
        packageInfo,
        isBlackArch ? distributionText.blackArch.source : text.kaliReference,
        "",
    );
    const officialLink = document.createElement("a");
    officialLink.href = isBlackArch ? tool.categoryUrl : tool.kaliUrl;
    officialLink.target = "_blank";
    officialLink.rel = "noopener noreferrer";
    officialLink.textContent = tool.categoryUrl || tool.kaliUrl;
    packageInfo.append(officialLink);
    if (isBlackArch) {
        if (tool.projectUrl) {
            const projectLink = document.createElement("a");
            projectLink.href = tool.projectUrl;
            projectLink.target = "_blank";
            projectLink.rel = "noopener noreferrer";
            projectLink.textContent = distributionText.blackArch.projectLabel;
            packageInfo.append(projectLink);
        }
        const repositoryGuide = document.createElement("a");
        repositoryGuide.href = "https://blackarch.org/downloads.html";
        repositoryGuide.target = "_blank";
        repositoryGuide.rel = "noopener noreferrer";
        repositoryGuide.textContent = distributionText.blackArch.repositoryLabel;
        packageInfo.append(repositoryGuide);
    }

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
securityGuideSearch.addEventListener("input", filterSecurityFieldGuide);
toolDistribution.addEventListener("change", () => {
    activeDistribution = toolDistribution.value;
    localStorage.setItem("mengkhong-tool-distribution", activeDistribution);
    toolCategory.value = "";
    activeToolProfile = null;
    toolDetail.hidden = true;
    toolLibraryHome.hidden = false;
    localizeToolLibrary();
});
toolLanguage.addEventListener("change", () => {
    toolPageLanguage = toolLanguage.value;
    localStorage.setItem("mengkhong-tool-language", toolPageLanguage);
    localizeToolLibrary();
});
localizeToolLibrary();
renderSecurityFieldGuide();

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
const authRoute = window.location.hash.slice(1);
if (recoveryInUrl) {
    showAuthView("reset");
} else if (["login", "register", "forgot"].includes(authRoute)) {
    showAuthView(authRoute);
} else {
    showPublicTools();
}

supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
        showAuthView("reset");
    } else if (event === "SIGNED_OUT") {
        currentUser = null;
        showPublicTools();
    }
});

const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
if (sessionError) {
    showError(sessionError);
} else if (
    sessionData.session
    && !recoveryInUrl
    && !["login", "register", "forgot"].includes(authRoute)
) {
    currentUser = sessionData.session.user;
    showPublicTools();
}

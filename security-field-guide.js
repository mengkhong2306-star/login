const securityFieldGuideData = [
    {
        category: "Reconnaissance & OSINT",
        safePractice: "Use public information only for assets and people in an approved scope. Validate sources, minimize personal data, and document uncertainty.",
        tools: [
            {
                name: "Maltego",
                summary: "A visual link-analysis platform for organizing relationships among domains, organizations, people, and other data points.",
                focus: "Learn to verify each relationship against its source and avoid treating inferred links as confirmed facts.",
            },
            {
                name: "Shodan",
                summary: "A search engine that indexes information about internet-connected devices and services.",
                focus: "Use it to review the public exposure of assets you own; treat banners and vulnerability indicators as leads to validate.",
            },
            {
                name: "theHarvester",
                summary: "Collects publicly available organization-related information, such as domains and contact details, from configured sources.",
                focus: "Review what your organization unintentionally exposes and handle personal information responsibly.",
            },
            {
                name: "Amass",
                summary: "A domain-focused asset-discovery and attack-surface-mapping toolkit.",
                focus: "Build an authorized inventory of your organization's domains and DNS records, then validate ownership.",
            },
            {
                name: "SpiderFoot",
                summary: "Automates collection and correlation of information from public data sources.",
                focus: "Assess source reliability, false positives, and privacy before recording or sharing findings.",
            },
        ],
    },
    {
        category: "Network Scanning & Enumeration",
        safePractice: "Only assess networks and services that are explicitly in scope. Coordinate scan timing and rate with system owners.",
        tools: [
            {
                name: "Nmap",
                summary: "A network-mapping utility used to inventory authorized hosts, ports, and services.",
                focus: "Understand how asset inventories support patch management and reduce unnecessary exposed services.",
            },
            {
                name: "Masscan",
                summary: "A high-throughput port-discovery scanner designed for broad network measurements.",
                focus: "Study scan impact, rate limits, and provider policies in a small, isolated lab rather than scanning public address space.",
            },
            {
                name: "Wireshark",
                summary: "A graphical network-protocol analyzer for reviewing saved captures or authorized network traffic.",
                focus: "Practice with sample captures and learn how encryption, protocol metadata, and sensitive-data handling affect analysis.",
            },
            {
                name: "Nessus",
                summary: "A vulnerability-assessment scanner that checks configured assets for known weaknesses and configuration issues.",
                focus: "Review findings against vendor advisories and confirm results safely before prioritizing remediation.",
            },
            {
                name: "OpenVAS / Greenbone",
                summary: "An open-source vulnerability-management and assessment platform for authorized infrastructure reviews.",
                focus: "Learn scan planning, credential handling, false-positive review, and remediation reporting.",
            },
            {
                name: "RustScan",
                summary: "A fast port-discovery tool that can hand results to Nmap for further service inventory.",
                focus: "Compare its inventory role with a full vulnerability assessment and keep testing inside a defined scope.",
            },
        ],
    },
    {
        category: "Web Application & API Testing",
        safePractice: "Use intentionally vulnerable practice apps or a staging service you control. Do not test public applications without written authorization.",
        tools: [
            {
                name: "Burp Suite (Community / Professional)",
                summary: "An intercepting proxy and web-security testing platform for inspecting application requests and responses.",
                focus: "Learn the HTTP request/response lifecycle and document findings using a deliberately vulnerable training application.",
            },
            {
                name: "OWASP ZAP",
                summary: "A free, open-source web application security testing proxy and dynamic-analysis platform.",
                focus: "Start with passive review on a local practice app and understand the limits of automated findings.",
            },
            {
                name: "sqlmap",
                summary: "A specialized tool for assessing whether an authorized test application is vulnerable to SQL injection.",
                focus: "Study parameterized queries and database error handling in a local training app; never use it to access real data.",
            },
            {
                name: "ffuf",
                summary: "A web fuzzing utility for testing how an authorized application responds to controlled input variations.",
                focus: "Use a local target and synthetic content to learn input validation and robust error handling.",
            },
            {
                name: "Gobuster",
                summary: "A discovery utility for reviewing web paths and DNS names within an approved asset inventory.",
                focus: "Use only against owned lab services or explicitly approved names, and respect rate limits.",
            },
            {
                name: "Nuclei",
                summary: "A template-based scanner for checking authorized systems for known exposures and configuration issues.",
                focus: "Review templates before use, select checks appropriate to a lab, and verify any alert manually.",
            },
            {
                name: "Postman",
                summary: "An API client for organizing requests and inspecting responses while developing or testing services.",
                focus: "Use test credentials and non-production data; learn authentication, authorization, and input-validation expectations.",
            },
            {
                name: "Kiterunner",
                summary: "An API route-discovery tool used to help inventory endpoints during an approved application review.",
                focus: "Keep endpoint discovery restricted to a test API and report undocumented routes to its owner.",
            },
        ],
    },
    {
        category: "Active Directory & Enterprise",
        safePractice: "Practice in a disposable, isolated directory lab with synthetic identities. Never use real employee credentials or production domains.",
        tools: [
            {
                name: "BloodHound",
                summary: "Uses graph analysis to visualize identity, group, and permission relationships in directory environments.",
                focus: "Learn to identify excessive permissions and improve least-privilege controls in a lab directory.",
            },
            {
                name: "Impacket",
                summary: "A Python library and set of utilities for working with Windows network protocols in administration and security research.",
                focus: "Study protocol behavior and defensive logging using a controlled lab and synthetic accounts.",
            },
            {
                name: "NetExec (formerly CrackMapExec)",
                summary: "A network-assessment framework for reviewing Windows and other enterprise services across an approved scope.",
                focus: "Use only in a lab to understand service exposure, access-control review, and audit logging.",
            },
            {
                name: "Responder",
                summary: "A dual-use tool used in labs to demonstrate risks from insecure local name-resolution protocols.",
                focus: "Learn how disabling unnecessary legacy protocols and improving network segmentation reduces credential exposure.",
            },
        ],
    },
    {
        category: "Exploitation Frameworks & Threat Emulation",
        safePractice: "These dual-use platforms can affect systems. Use isolated, disposable lab targets and a written test plan; never deploy against systems outside scope.",
        tools: [
            {
                name: "Metasploit Framework",
                summary: "A modular security-testing framework used by professionals to validate known weaknesses in controlled assessments.",
                focus: "Study vulnerability management and defensive detection with deliberately vulnerable local training systems.",
            },
            {
                name: "BeEF",
                summary: "A browser-security research framework for studying client-side risks in a controlled training environment.",
                focus: "Learn browser security controls and safe handling of test profiles in a disconnected lab.",
            },
            {
                name: "Sliver",
                summary: "An open-source command-and-control framework used in authorized threat-emulation research.",
                focus: "Focus on defensive telemetry and incident response using an isolated, non-routable lab.",
            },
            {
                name: "Cobalt Strike",
                summary: "A commercial threat-emulation platform used by authorized security teams to assess detection and response.",
                focus: "Use only under the vendor's license and a formal engagement plan; study detection outcomes rather than deployment techniques.",
            },
        ],
    },
    {
        category: "Privilege & Post-Access Security Review",
        safePractice: "Use disposable lab machines and synthetic data. Treat credential-related output as highly sensitive, even during authorized testing.",
        tools: [
            {
                name: "PEASS-ng (LinPEAS / WinPEAS)",
                summary: "A collection of system-review checklists and scripts that highlight configuration conditions defenders should examine.",
                focus: "Practice interpreting findings on your own lab VM and prioritize configuration fixes rather than attempting escalation.",
            },
            {
                name: "GTFOBins / LOLBAS",
                summary: "Reference projects documenting security risks involving built-in Unix and Windows utilities.",
                focus: "Use the references to harden execution policies, permissions, and monitoring in a lab.",
            },
            {
                name: "Mimikatz",
                summary: "A sensitive Windows security research tool associated with credential-material exposure and authentication testing.",
                focus: "Learn credential-protection and monitoring concepts using synthetic lab data only; never collect real users' secrets.",
            },
        ],
    },
    {
        category: "Password Security",
        safePractice: "Limit password research to offline, synthetic hashes that you created or are explicitly authorized to audit. Avoid live login attempts.",
        tools: [
            {
                name: "Hashcat",
                summary: "A password-recovery and password-policy auditing tool that can process authorized offline test data.",
                focus: "Compare password-policy choices using synthetic data and protect any audit files and results.",
            },
            {
                name: "John the Ripper",
                summary: "A flexible offline password-auditing suite supporting many formats of authorized test data.",
                focus: "Learn how password length, uniqueness, and modern hashing settings affect defensive resilience.",
            },
            {
                name: "Hydra",
                summary: "A dual-use network authentication testing tool that can cause account lockouts and service disruption.",
                focus: "Do not use it for live login guessing; study rate limiting, MFA, lockout policy, and authentication logs instead.",
            },
        ],
    },
    {
        category: "Wireless Auditing",
        safePractice: "Use only your own access point in a controlled RF lab, and follow local radio rules. Avoid disrupting nearby networks.",
        tools: [
            {
                name: "Aircrack-ng",
                summary: "A collection of wireless security assessment utilities for authorized Wi-Fi testing.",
                focus: "Learn secure Wi-Fi configuration and capture analysis with your own isolated test equipment.",
            },
            {
                name: "Kismet",
                summary: "A wireless network detector and monitoring platform useful for authorized inventory and troubleshooting.",
                focus: "Practice with your own equipment and consider privacy implications when monitoring radio environments.",
            },
            {
                name: "Wifite",
                summary: "A wireless-auditing automation tool that coordinates checks across compatible security utilities.",
                focus: "Use only with an isolated test access point and understand each check's impact before running any assessment.",
            },
        ],
    },
    {
        category: "Cloud Security",
        safePractice: "Use a dedicated sandbox account, least-privilege access, and non-production resources. Confirm assessment scope with the cloud owner.",
        tools: [
            {
                name: "Prowler",
                summary: "A cloud security assessment tool that reviews provider configurations against security benchmarks and best practices.",
                focus: "Learn to map findings to corrective configuration changes and verify them in a sandbox account.",
            },
            {
                name: "Pacu",
                summary: "An AWS security research framework for authorized cloud security assessments.",
                focus: "Use a sandbox with synthetic resources and narrowly scoped permissions; avoid production data and accounts.",
            },
            {
                name: "ScoutSuite",
                summary: "A multi-cloud security auditing tool that reviews configuration and identity posture through provider APIs.",
                focus: "Learn secure audit-role design, report handling, and remediation prioritization in test accounts.",
            },
        ],
    },
    {
        category: "AI & Automation",
        safePractice: "Treat generated suggestions as unverified. Use fictional or sanitized data and never provide secrets, customer data, or unauthorized target details.",
        tools: [
            {
                name: "PentestGPT",
                summary: "An AI research assistant intended to help organize security-testing concepts and workflows.",
                focus: "Use it to clarify terminology and structure authorized assessments; independently verify advice and keep work within scope.",
            },
            {
                name: "Burp Suite BChecks",
                summary: "A customizable check format for Burp Scanner; BChecks are rules and are not inherently an AI feature.",
                focus: "Study how custom checks identify expected behavior in a test application, and validate results before reporting.",
            },
        ],
    },
];

const safeQuickStarts = {
    Maltego: { type: "launch", text: "maltego", label: "Launch the desktop app", note: "Opens the application only; do not run transforms against people or organizations without a documented, authorized purpose." },
    Shodan: { type: "command", text: "shodan --help", label: "Show CLI help", note: "Displays local command help. It does not query Shodan or search for devices." },
    theHarvester: { type: "command", text: "theHarvester -h", label: "Show CLI help", note: "Displays usage information only; it does not collect data." },
    Amass: { type: "command", text: "amass -h", label: "Show CLI help", note: "Displays local usage information only; it does not enumerate domains." },
    SpiderFoot: { type: "command", text: "python3 sf.py --help", label: "Show CLI help", note: "Run from the SpiderFoot source directory. This displays help only and does not start a scan." },
    Nmap: { type: "command", text: "nmap --help", label: "Show CLI help", note: "Displays local help only; it does not scan a host." },
    Masscan: { type: "command", text: "masscan --help", label: "Show CLI help", note: "Displays local help only; it does not send probes." },
    Wireshark: { type: "command", text: "wireshark --help", label: "Show CLI help", note: "Displays local help only; it does not capture network traffic." },
    Nessus: { type: "command", text: "nessuscli help", label: "Show CLI help", note: "Displays local CLI help. Nessus setup and scan management vary by installation." },
    "OpenVAS / Greenbone": { type: "command", text: "gvm-cli --help", label: "Show CLI help", note: "Displays local client help only; it does not connect to a manager or start an assessment." },
    RustScan: { type: "command", text: "rustscan --help", label: "Show CLI help", note: "Displays local help only; it does not scan a port or host." },
    "Burp Suite (Community / Professional)": { type: "launch", text: "burpsuite", label: "Launch the desktop app", note: "Opens Burp Suite. Do not configure a target or run checks except in an authorized test environment." },
    "OWASP ZAP": { type: "command", text: "zaproxy -h", label: "Show CLI help", note: "Displays local help only; it does not launch a scan." },
    sqlmap: { type: "command", text: "sqlmap --help", label: "Show CLI help", note: "Displays local help only; it does not send requests or test an application." },
    ffuf: { type: "command", text: "ffuf -h", label: "Show CLI help", note: "Displays local help only; it does not send web requests." },
    Gobuster: { type: "command", text: "gobuster help", label: "Show CLI help", note: "Displays local help only; it does not enumerate a site or domain." },
    Nuclei: { type: "command", text: "nuclei -h", label: "Show CLI help", note: "Displays local help only; it does not run templates against a target." },
    Postman: { type: "launch", text: "postman", label: "Launch the desktop app", note: "Opens Postman. Use a local practice API and synthetic data when you begin testing requests." },
    Kiterunner: { type: "command", text: "kr help", label: "Show CLI help", note: "Displays local help only; it does not send requests to an API." },
    BloodHound: { type: "launch", text: "bloodhound", label: "Launch the desktop app", note: "Opens the interface only. Use synthetic identities in an isolated directory lab." },
    Impacket: { type: "command", text: "impacket-smbclient -h", label: "Show CLI help", note: "Displays the SMB client usage only; without connection options, it does not contact a server." },
    "NetExec (formerly CrackMapExec)": { type: "command", text: "nxc --help", label: "Show CLI help", note: "Displays local help only; it does not connect to a network or authenticate." },
    Responder: { type: "command", text: "responder -h", label: "Show CLI help", note: "Displays local help only; it does not listen on a network interface." },
    "Metasploit Framework": { type: "command", text: "msfconsole --help", label: "Show CLI help", note: "Displays local help only; it does not start a session or run a module." },
    BeEF: { type: "command", text: "beef-xss -h", label: "Show CLI help", note: "Displays local help only; it does not start the framework or hook a browser." },
    Sliver: { type: "command", text: "sliver-server version", label: "Show version", note: "Displays the installed server version only; it does not start a listener or session." },
    "Cobalt Strike": { type: "reference", text: "Open the licensed Cobalt Strike client and read its built-in help.", label: "Licensed application", note: "There is no universal safe CLI command; use only the licensed client and vendor documentation." },
    "PEASS-ng (LinPEAS / WinPEAS)": { type: "reference", text: "Read the official PEASS-ng documentation before running any script.", label: "Review documentation first", note: "There is no generally safe scan command: these scripts inspect the system where they run. Start with a disposable lab VM and review the script and scope first." },
    "GTFOBins / LOLBAS": { type: "reference", text: "Open the GTFOBins and LOLBAS project documentation.", label: "Reference projects", note: "These are online references, not a single command-line program. Use them to understand and mitigate configuration risks." },
    Mimikatz: { type: "command", text: "mimikatz.exe /?", label: "Show program help", note: "Requests local usage help only. Do not collect, display, or share real credentials or authentication material." },
    Hashcat: { type: "command", text: "hashcat --help", label: "Show CLI help", note: "Displays local help only; it does not load hashes or attempt password recovery." },
    "John the Ripper": { type: "command", text: "john --list=formats", label: "List supported formats", note: "Prints local format information only; it does not read a hash file or attempt password recovery." },
    Hydra: { type: "command", text: "hydra -h", label: "Show CLI help", note: "Displays local help only; it does not make login attempts. Avoid live password guessing." },
    "Aircrack-ng": { type: "command", text: "aircrack-ng --help", label: "Show CLI help", note: "Displays local help only; it does not inspect a capture or interact with a wireless network." },
    Kismet: { type: "command", text: "kismet --help", label: "Show CLI help", note: "Displays local help only; it does not start wireless monitoring." },
    Wifite: { type: "command", text: "wifite --help", label: "Show CLI help", note: "Displays local help only; it does not scan or interact with nearby networks." },
    Prowler: { type: "command", text: "prowler --help", label: "Show CLI help", note: "Displays local help only; it does not access a cloud account or run checks." },
    Pacu: { type: "command", text: "python3 pacu.py --help", label: "Show CLI help", note: "Run from the Pacu source directory. This displays help only; it does not access an AWS account." },
    ScoutSuite: { type: "command", text: "scout --help", label: "Show CLI help", note: "Displays local help only; it does not authenticate to a cloud provider or collect account data." },
    PentestGPT: { type: "command", text: "pentestgpt --help", label: "Show CLI help", note: "If supported by your installed version, displays local help only. Do not provide it with secrets or real target details." },
    "Burp Suite BChecks": { type: "reference", text: "In Burp Suite, open Scanner and review the BChecks documentation.", label: "In-app learning path", note: "BChecks are custom scanner checks, not a standalone command. Test your own check only against an authorized practice application." },
};

export const securityFieldGuide = securityFieldGuideData.map((category) => ({
    ...category,
    tools: category.tools.map((tool) => {
        const quickStart = safeQuickStarts[tool.name];
        if (!quickStart) throw new Error(`Missing safe quick start for ${tool.name}`);
        return { ...tool, quickStart };
    }),
}));

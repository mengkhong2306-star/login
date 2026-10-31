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

const toolEducation = {
    Maltego: {
        details: "Maltego presents information as a graph: entities such as domains or organizations are nodes, and sourced relationships are links. Results depend on the data sources and transforms available to your account, so a link is a research lead rather than proof.",
        safeUse: "Create a small graph from fictional or organization-owned sample data. Open each source, record where a fact came from, and distinguish confirmed facts from inferred connections.",
        installUrl: "https://www.maltego.com/downloads/",
        docsUrl: "https://docs.maltego.com/",
    },
    Shodan: {
        details: "Shodan indexes service banners and metadata collected from internet-connected devices. It complements an asset inventory, but its records can be stale and should not be treated as a live vulnerability confirmation.",
        safeUse: "Start with Shodan's documentation and search only for assets your organization owns. Compare any result with your own inventory and report unexpected exposure to the asset owner.",
        installUrl: "https://cli.shodan.io/",
        docsUrl: "https://help.shodan.io/",
    },
    theHarvester: {
        details: "theHarvester queries supported public sources and organizes domain-related information such as hostnames and contact addresses. Available results depend on source access, configuration, and provider limits.",
        safeUse: "Use a domain explicitly assigned to your organization, review each result's source, and remove personal data that is not needed for the inventory.",
        installUrl: "https://github.com/laramies/theHarvester",
        docsUrl: "https://github.com/laramies/theHarvester/wiki",
    },
    Amass: {
        details: "Amass helps map an organization's external domain and DNS footprint by combining passive sources and other supported discovery methods. It is an inventory aid, not proof that every discovered name is in scope or active.",
        safeUse: "Read the project scope and data-source documentation first. Work from an approved organization-owned domain, begin with passive inventory concepts, and have an owner confirm discovered assets.",
        installUrl: "https://github.com/owasp-amass/amass/blob/master/doc/user_guide.md",
        docsUrl: "https://owasp.org/www-project-amass/",
    },
    SpiderFoot: {
        details: "SpiderFoot automates collection and correlation across many data sources, then presents observations and relationships for review. Integrations may require accounts or API keys; protect those secrets and assess source reliability.",
        safeUse: "Review enabled modules before a run, use an approved organization-owned seed, avoid collecting unnecessary personal information, and treat correlations as unverified leads.",
        installUrl: "https://github.com/smicallef/spiderfoot",
        docsUrl: "https://www.spiderfoot.net/documentation/",
    },
    Nmap: {
        details: "Nmap identifies reachable hosts and describes network services using configurable probes. Its output supports asset inventory and service-owner verification; scan results can vary with network controls and timing.",
        safeUse: "Learn the output format with the built-in help and published sample data. For practical testing, use a private virtual lab you control and obtain written approval before assessing any other network.",
        installUrl: "https://nmap.org/book/install.html",
        docsUrl: "https://nmap.org/book/man.html",
    },
    Masscan: {
        details: "Masscan is optimized for high-rate port discovery. Its speed can generate substantial traffic, trigger alerts, or affect fragile equipment, so it requires careful rate planning and an explicitly authorized scope.",
        safeUse: "Begin with the source documentation and a small isolated virtual network. Study rate limits and packet impact; do not scan public address ranges or networks you do not administer.",
        installUrl: "https://github.com/robertdavidgraham/masscan",
        docsUrl: "https://github.com/robertdavidgraham/masscan/blob/master/README.md",
    },
    Wireshark: {
        details: "Wireshark decodes packet captures into protocol layers and fields. It is useful for troubleshooting and defensive investigations, but captures can contain credentials or personal data if traffic is unencrypted.",
        safeUse: "Open a provided sample capture, select a packet, and follow its protocol layers. Prefer offline sample files; limit live capture to an interface and network you are authorized to monitor.",
        installUrl: "https://www.wireshark.org/download.html",
        docsUrl: "https://www.wireshark.org/docs/",
    },
    Nessus: {
        details: "Nessus checks selected assets against vulnerability and configuration tests and produces findings for review. The scanner can affect systems; findings may be false positives, and scan profiles determine impact.",
        safeUse: "Read the setup and scan policy documentation, obtain written approval, and practice against a disposable lab target. Review credentials, scan scope, rate, and maintenance window with the system owner.",
        installUrl: "https://www.tenable.com/downloads/nessus",
        docsUrl: "https://docs.tenable.com/nessus/",
    },
    "OpenVAS / Greenbone": {
        details: "Greenbone's vulnerability-management platform coordinates feeds, scan configurations, results, and remediation reports. It requires a manager/scanner setup and current vulnerability data; an alert is a lead to validate.",
        safeUse: "Follow the official installation guide for a supported lab setup. First learn how scan configurations and reports work, then have an owner approve a narrowly scoped test and safe schedule.",
        installUrl: "https://greenbone.github.io/docs/latest/",
        docsUrl: "https://greenbone.github.io/docs/latest/",
    },
    RustScan: {
        details: "RustScan performs fast port discovery and can pass results to Nmap for service identification. Fast discovery is not a full vulnerability assessment and can still create load or trigger monitoring.",
        safeUse: "Read its scope and rate guidance, then compare help output with a small local virtual lab. Do not direct it at public or third-party systems.",
        installUrl: "https://github.com/RustScan/RustScan",
        docsUrl: "https://github.com/RustScan/RustScan#usage",
    },
    "Burp Suite (Community / Professional)": {
        details: "Burp Suite is an intercepting proxy for inspecting how a browser and web application exchange HTTP messages. Community and Professional editions differ in features; automated checks can alter application state.",
        safeUse: "Use a dedicated browser profile and a deliberately vulnerable local training app. Learn to read requests and responses before changing anything, and keep proxy scope limited to that lab.",
        installUrl: "https://portswigger.net/burp/releases",
        docsUrl: "https://portswigger.net/burp/documentation",
    },
    "OWASP ZAP": {
        details: "ZAP is an open-source proxy and dynamic application testing tool. It can passively observe requests and can also send active test traffic, so the mode and target scope matter.",
        safeUse: "Install the desktop application, use its learning materials, and start with a local practice app and passive observations. Do not use automated active scans on a public site without explicit permission.",
        installUrl: "https://www.zaproxy.org/download/",
        docsUrl: "https://www.zaproxy.org/getting-started/",
    },
    sqlmap: {
        details: "sqlmap automates SQL-injection testing against web requests and can retrieve or alter data when misused. Its capabilities make it appropriate only for a specifically authorized test application.",
        safeUse: "Learn the underlying issue using a deliberately vulnerable local training app and its remediation lesson. Focus on parameterized queries, least-privilege database accounts, and safe report interpretation.",
        installUrl: "https://github.com/sqlmapproject/sqlmap",
        docsUrl: "https://github.com/sqlmapproject/sqlmap/wiki",
    },
    ffuf: {
        details: "ffuf sends many controlled HTTP requests to compare application responses. It is commonly used for content discovery and input testing, but request volume can burden services and reveal non-public paths.",
        safeUse: "Use a local training service, synthetic wordlists, and conservative settings described in the official documentation. Learn to recognize response differences without testing external sites.",
        installUrl: "https://github.com/ffuf/ffuf",
        docsUrl: "https://github.com/ffuf/ffuf#usage",
    },
    Gobuster: {
        details: "Gobuster checks candidate names or paths against a specified service to help maintain an approved asset inventory. It generates traffic and may expose paths that should remain private.",
        safeUse: "Practice against a local web server you control and a small synthetic wordlist. Review the mode and impact before use, and never enumerate third-party domains without written authorization.",
        installUrl: "https://github.com/OJ/gobuster",
        docsUrl: "https://github.com/OJ/gobuster#usage",
    },
    Nuclei: {
        details: "Nuclei runs declarative templates that check for known exposures and configuration patterns. Templates are code-like checks; inspect their behavior and source before running them.",
        safeUse: "Read the template documentation and inspect each selected template. Use a local test application, review logs and request impact, and verify any alert with the application owner.",
        installUrl: "https://docs.projectdiscovery.io/tools/nuclei/install",
        docsUrl: "https://docs.projectdiscovery.io/tools/nuclei/overview",
    },
    Postman: {
        details: "Postman organizes API requests, environments, tests, and documentation. Environment variables can contain tokens, so keep secrets out of shared workspaces and exported collections.",
        safeUse: "Import a training collection or use a local API, inspect method, URL, headers, and body before sending, and use synthetic credentials and data.",
        installUrl: "https://www.postman.com/downloads/",
        docsUrl: "https://learning.postman.com/docs/getting-started/overview/",
    },
    Kiterunner: {
        details: "Kiterunner helps assess API route coverage by comparing candidate routes with an approved API. Discovery results should be reconciled with the API specification and service owner.",
        safeUse: "Start with the project's documentation and an intentionally local test API. Keep route discovery within written scope and use low-impact lab settings.",
        installUrl: "https://github.com/assetnote/kiterunner",
        docsUrl: "https://github.com/assetnote/kiterunner#usage",
    },
    BloodHound: {
        details: "BloodHound models identity and permission relationships as a graph so defenders can locate excessive privileges and risky trust paths. Data collection and graph exports are sensitive and must be protected.",
        safeUse: "Use the vendor's community lab materials and synthetic identities in an isolated directory. Focus on explaining a permission path and recommending least-privilege remediation.",
        installUrl: "https://github.com/SpecterOps/BloodHound",
        docsUrl: "https://bloodhound.specterops.io/",
    },
    Impacket: {
        details: "Impacket is a Python library and collection of protocol utilities. It supports legitimate protocol analysis and administration but also includes powerful remote-access and credential-related capabilities.",
        safeUse: "Study protocol documentation and benign help output in a disposable lab. Use synthetic accounts, avoid credential-dumping functions, and monitor the corresponding defensive logs.",
        installUrl: "https://github.com/fortra/impacket",
        docsUrl: "https://github.com/fortra/impacket/tree/master/examples",
    },
    "NetExec (formerly CrackMapExec)": {
        details: "NetExec is a multi-protocol assessment framework for reviewing enterprise services. Some features can attempt authentication or execute actions remotely, so misuse can cause lockouts or compromise.",
        safeUse: "Use only in an isolated directory lab with test accounts and written scope. For learning, review documentation and defensive event logs; do not run password-spraying or remote-execution workflows.",
        installUrl: "https://www.netexec.wiki/getting-started/installation",
        docsUrl: "https://www.netexec.wiki/",
    },
    Responder: {
        details: "Responder demonstrates risks in legacy local name-resolution protocols by answering network requests. Its normal operation can capture authentication challenge material from nearby systems.",
        safeUse: "Do not run it on a shared or production network. Study the protocol and defenses from documentation or a disconnected lab with synthetic machines; focus on disabling legacy resolution and monitoring.",
        installUrl: "https://github.com/lgandx/Responder",
        docsUrl: "https://github.com/lgandx/Responder/blob/master/README.md",
    },
    "Metasploit Framework": {
        details: "Metasploit is a modular validation framework containing auxiliary checks, exploit modules, payloads, and post-access features. Modules can change or interrupt target systems.",
        safeUse: "Use the official training course and intentionally vulnerable, isolated VMs. Learn vulnerability identification and defensive evidence first; do not use exploit or payload modules against real systems.",
        installUrl: "https://docs.metasploit.com/docs/using-metasploit/getting-started/nightly-installers.html",
        docsUrl: "https://docs.metasploit.com/",
    },
    BeEF: {
        details: "BeEF is a browser-security research framework that demonstrates how unsafe browser content and trust decisions can create risk. A hooked browser can expose sensitive information and affect connected environments.",
        safeUse: "Use only a disconnected training VM and a browser profile created for that lab. Study browser protections and detection; never send hook content to a real user or device.",
        installUrl: "https://github.com/beefproject/beef",
        docsUrl: "https://github.com/beefproject/beef/wiki",
    },
    Sliver: {
        details: "Sliver is a red-team command-and-control framework for authorized emulation. Its implant and session capabilities are highly sensitive and can provide remote control of a machine.",
        safeUse: "Do not deploy agents or listeners on public networks. Learn with vendor documentation and defensive telemetry in a disconnected, disposable lab under a formal written plan.",
        installUrl: "https://github.com/BishopFox/sliver",
        docsUrl: "https://sliver.sh/docs",
    },
    "Cobalt Strike": {
        details: "Cobalt Strike is a licensed threat-emulation platform for professional security teams. It can control test endpoints and is frequently abused, so licensing, authorization, and isolation are essential.",
        safeUse: "Follow the vendor's legal use policy and training. Work only in a dedicated isolated environment with written authorization and a defensive objective; never distribute or run unlicensed copies.",
        installUrl: "https://www.cobaltstrike.com/",
        docsUrl: "https://hstechdocs.helpsystems.com/manuals/cobaltstrike/current/",
    },
    "PEASS-ng (LinPEAS / WinPEAS)": {
        details: "PEASS-ng provides local system-audit scripts that flag permissions, configuration, and software conditions for review. Findings are indicators, not proof that a system is vulnerable.",
        safeUse: "Read the script and documentation before running it, and use a disposable VM you own. Prefer recording configuration findings and applying documented hardening fixes over attempting privilege escalation.",
        installUrl: "https://github.com/peass-ng/PEASS-ng",
        docsUrl: "https://github.com/peass-ng/PEASS-ng/tree/master/linPEAS",
    },
    "GTFOBins / LOLBAS": {
        details: "GTFOBins and LOLBAS are reference catalogs describing security-relevant behavior of built-in Unix and Windows programs. They are documentation, not installable scanners.",
        safeUse: "Use the entries to identify risky permissions and execution policies, then consult platform documentation and improve controls. Avoid copying abuse recipes into production systems.",
        installUrl: "https://gtfobins.github.io/",
        docsUrl: "https://lolbas-project.github.io/",
    },
    Mimikatz: {
        details: "Mimikatz is a Windows security research tool associated with sensitive authentication material. Running it can expose credentials and trigger endpoint protections; even test output must be treated as secret.",
        safeUse: "Do not run it on a personal, workplace, or production computer. Learn credential protections and detection from official Windows security documentation or a purpose-built isolated training lab with synthetic identities.",
        installUrl: "https://github.com/gentilkiwi/mimikatz",
        docsUrl: "https://github.com/gentilkiwi/mimikatz/wiki",
    },
    Hashcat: {
        details: "Hashcat performs offline password recovery against supplied hash data and can consume substantial GPU resources. Hashes remain sensitive data, even when they are not plaintext passwords.",
        safeUse: "Use only synthetic hashes generated for a password-policy lesson. Protect input and result files, set resource limits for your hardware, and focus on strengthening password storage and user guidance.",
        installUrl: "https://hashcat.net/wiki/doku.php?id=download",
        docsUrl: "https://hashcat.net/wiki/",
    },
    "John the Ripper": {
        details: "John the Ripper audits password strength offline across a range of hash and file formats. It may use substantial CPU resources, and input hashes should be treated as confidential.",
        safeUse: "Use a synthetic sample from a password-security lesson. Learn how to identify the format and interpret the report without using real account hashes or attempting online logins.",
        installUrl: "https://www.openwall.com/john/",
        docsUrl: "https://www.openwall.com/john/doc/",
    },
    Hydra: {
        details: "Hydra attempts authentication against network services and can lock accounts, violate acceptable-use rules, or expose passwords. This guide intentionally does not provide login-guessing instructions.",
        safeUse: "Do not test live accounts. Learn defenses instead: review MFA, throttling, lockout policy, password-reset controls, and authentication logs in your own application.",
        installUrl: "https://github.com/vanhauser-thc/thc-hydra",
        docsUrl: "https://github.com/vanhauser-thc/thc-hydra",
    },
    "Aircrack-ng": {
        details: "Aircrack-ng is a suite for wireless network assessment and capture analysis. Some functions can disrupt radio communications or attempt to recover wireless credentials.",
        safeUse: "Study Wi-Fi security concepts and sample captures first. Any practical lab must use your own isolated access point, test clients, and an RF environment where you have permission to transmit.",
        installUrl: "https://www.aircrack-ng.org/doku.php?id=install_aircrack",
        docsUrl: "https://www.aircrack-ng.org/doku.php",
    },
    Kismet: {
        details: "Kismet passively monitors wireless and other supported radio sources for network inventory and troubleshooting. Captures can reveal private device identifiers and location-related information.",
        safeUse: "Begin with the install and configuration documentation. Monitor only your own lab equipment, minimize retained data, and avoid collecting neighbors' wireless traffic.",
        installUrl: "https://www.kismetwireless.net/docs/readme/installing_kismet/",
        docsUrl: "https://www.kismetwireless.net/docs/",
    },
    Wifite: {
        details: "Wifite automates sequences of wireless checks by coordinating other installed tools. Automation can make disruptive actions easier to trigger and does not replace understanding each component.",
        safeUse: "Do not use automated checks against nearby networks. Learn the component tools separately with documentation and your own isolated access point; keep the RF lab controlled and authorized.",
        installUrl: "https://github.com/derv82/wifite2",
        docsUrl: "https://github.com/derv82/wifite2/wiki",
    },
    Prowler: {
        details: "Prowler evaluates cloud configuration against security benchmarks and provider guidance. It uses cloud identity permissions, and reports can contain sensitive account and resource details.",
        safeUse: "Follow the least-privilege audit setup in a dedicated sandbox account. Review requested permissions, store reports securely, and turn each verified finding into a reviewed configuration fix.",
        installUrl: "https://docs.prowler.com/projects/prowler-open-source/en/latest/",
        docsUrl: "https://docs.prowler.com/",
    },
    Pacu: {
        details: "Pacu is an AWS security research framework with modules that can inspect or change cloud resources. Some operations can expose data or create persistent changes, so it is inappropriate for casual use.",
        safeUse: "Use a disposable AWS sandbox with synthetic resources and narrowly scoped temporary credentials. Study AWS IAM and audit logging first; do not use modules that access, alter, or persist in real accounts.",
        installUrl: "https://github.com/RhinoSecurityLabs/pacu",
        docsUrl: "https://github.com/RhinoSecurityLabs/pacu/wiki",
    },
    ScoutSuite: {
        details: "ScoutSuite collects cloud configuration through provider APIs and summarizes security posture. Reports may contain account identifiers, resource names, and configuration details that must be protected.",
        safeUse: "Use a sandbox account with a reviewed read-only audit role. Learn provider permissions, protect generated reports, and validate findings before changing any resource.",
        installUrl: "https://github.com/nccgroup/ScoutSuite",
        docsUrl: "https://github.com/nccgroup/ScoutSuite/wiki",
    },
    PentestGPT: {
        details: "PentestGPT is an experimental AI assistant project for organizing security-testing concepts. AI output can be inaccurate, unsafe, or outdated; sending data to a hosted model may disclose it.",
        safeUse: "Use fictional scenarios and sanitized notes only. Ask it to explain security concepts or remediation, independently verify each claim, and do not request or follow exploit instructions.",
        installUrl: "https://github.com/GreyDGL/PentestGPT",
        docsUrl: "https://github.com/GreyDGL/PentestGPT",
    },
    "Burp Suite BChecks": {
        details: "BChecks are Burp Scanner rules written in a constrained format to check application behavior. They are customizable checks, not an AI feature or a separate scanner installation.",
        safeUse: "Read the format documentation and inspect a check before enabling it. Create a benign check for an expected response in a local training app and validate the result manually.",
        installUrl: "https://portswigger.net/burp/documentation/scanner/bchecks",
        docsUrl: "https://portswigger.net/burp/documentation/scanner/bchecks",
    },
};

export const securityFieldGuide = securityFieldGuideData.map((category) => ({
    ...category,
    tools: category.tools.map((tool) => {
        const quickStart = safeQuickStarts[tool.name];
        const education = toolEducation[tool.name];
        if (!quickStart || !education) throw new Error(`Missing learning resources for ${tool.name}`);
        return { ...tool, quickStart, ...education };
    }),
}));

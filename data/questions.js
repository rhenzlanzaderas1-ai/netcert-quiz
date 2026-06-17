/**
 * NetCert Question Bank — Bilingual (Traditional Chinese + English)
 *
 * Schema:
 *  id          : Number
 *  category    : String   — Chinese category name
 *  category_en : String   — English category name
 *  question    : String   — Question (Chinese)
 *  question_en : String   — Question (English)
 *  options     : String[] — 4 options (Chinese)
 *  options_en  : String[] — 4 options (English)
 *  answer      : Number   — 0-based correct index
 *  imagePath   : String|null
 *  imageContext: String|null
 *  explanation    : String|null — Chinese explanation
 *  explanation_en : String|null — English explanation
 */

const QUESTION_BANK = [

  // ══════════════════════════════════════════════════
  // 網路基礎概論 | Network Fundamentals
  // ══════════════════════════════════════════════════
  {
    id: 1,
    category: "網路基礎概論", category_en: "Network Fundamentals",
    question: "下列何者不是電腦網路的主要功能？",
    question_en: "Which of the following is NOT a primary function of a computer network?",
    options: ["資源共享","資料傳輸","程式編譯","分散式處理"],
    options_en: ["Resource sharing","Data transmission","Program compilation","Distributed processing"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "電腦網路的主要功能包括資源共享、資料傳輸、分散式處理等，程式編譯不是網路的主要功能。",
    explanation_en: "Primary network functions include resource sharing, data transmission, and distributed processing. Program compilation is not a network function."
  },
  {
    id: 2,
    category: "網路基礎概論", category_en: "Network Fundamentals",
    question: "在 OSI 七層模型中，負責路由選擇的是哪一層？",
    question_en: "Which layer of the OSI model is responsible for routing?",
    options: ["資料鏈結層 (Data Link Layer)","網路層 (Network Layer)","傳輸層 (Transport Layer)","會議層 (Session Layer)"],
    options_en: ["Data Link Layer","Network Layer","Transport Layer","Session Layer"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "網路層 (Layer 3) 負責路由選擇和邏輯定址。",
    explanation_en: "The Network Layer (Layer 3) is responsible for routing and logical addressing."
  },
  {
    id: 3,
    category: "網路基礎概論", category_en: "Network Fundamentals",
    question: "下列哪一種網路拓撲具有單一故障點會導致全網癱瘓的缺點？",
    question_en: "Which network topology has a single point of failure that can bring down the entire network?",
    options: ["星狀拓撲 (Star)","環狀拓撲 (Ring)","匯流排拓撲 (Bus)","網狀拓撲 (Mesh)"],
    options_en: ["Star Topology","Ring Topology","Bus Topology","Mesh Topology"],
    answer: 2,
    imagePath: null,
    imageContext: "Bus Topology diagram: all devices connected to a single backbone cable",
    explanation: "匯流排拓撲中，所有節點共用一條傳輸線，若主線斷裂，所有節點皆無法通訊。",
    explanation_en: "In a Bus topology, all nodes share one backbone cable. If it breaks, all nodes lose communication."
  },
  {
    id: 4,
    category: "網路基礎概論", category_en: "Network Fundamentals",
    question: "TCP/IP 協定中，HTTP 協定屬於哪一層？",
    question_en: "In the TCP/IP model, which layer does HTTP belong to?",
    options: ["網路介面層","網際網路層","傳輸層","應用層"],
    options_en: ["Network Interface Layer","Internet Layer","Transport Layer","Application Layer"],
    answer: 3,
    imagePath: null, imageContext: null,
    explanation: "HTTP 屬於 TCP/IP 模型的應用層協定。",
    explanation_en: "HTTP is an Application Layer protocol in the TCP/IP model."
  },
  {
    id: 5,
    category: "網路基礎概論", category_en: "Network Fundamentals",
    question: "下列何者為全雙工（Full-Duplex）通訊方式的例子？",
    question_en: "Which of the following is an example of Full-Duplex communication?",
    options: ["無線電對講機","電視廣播","電話通話","衛星單向傳輸"],
    options_en: ["Walkie-talkie radio","Television broadcast","Telephone call","One-way satellite transmission"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "電話通話允許雙方同時收發訊息，屬於全雙工通訊。",
    explanation_en: "A telephone call allows both parties to send and receive simultaneously — Full-Duplex."
  },
  {
    id: 6,
    category: "網路基礎概論", category_en: "Network Fundamentals",
    question: "OSI 模型中，哪一層負責資料的加密與解密？",
    question_en: "Which OSI layer is responsible for data encryption and decryption?",
    options: ["應用層 (Application Layer)","表達層 (Presentation Layer)","會議層 (Session Layer)","傳輸層 (Transport Layer)"],
    options_en: ["Application Layer","Presentation Layer","Session Layer","Transport Layer"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "表達層負責資料格式轉換、加密解密及壓縮。",
    explanation_en: "The Presentation Layer handles data format conversion, encryption/decryption, and compression."
  },
  {
    id: 7,
    category: "網路基礎概論", category_en: "Network Fundamentals",
    question: "下列哪種傳輸媒介的傳輸速度最快？",
    question_en: "Which transmission medium provides the fastest data transfer speed?",
    options: ["雙絞線 (Twisted Pair)","同軸電纜 (Coaxial Cable)","光纖 (Fiber Optic)","無線電波 (Radio Wave)"],
    options_en: ["Twisted Pair","Coaxial Cable","Fiber Optic","Radio Wave"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "光纖利用光訊號傳輸，具有最高的傳輸速率和頻寬。",
    explanation_en: "Fiber optic uses light signals to achieve the highest transmission speed and bandwidth."
  },
  {
    id: 8,
    category: "網路基礎概論", category_en: "Network Fundamentals",
    question: "下列何者是區域網路（LAN）的特性？",
    question_en: "Which of the following is a characteristic of a Local Area Network (LAN)?",
    options: ["涵蓋範圍通常在數公里以內","通常由電信公司管理","連接不同城市的網路","使用衛星進行通訊"],
    options_en: ["Typically covers a small geographic area (within a few km)","Usually managed by a telecom company","Connects networks across different cities","Uses satellites for communication"],
    answer: 0,
    imagePath: null, imageContext: null,
    explanation: "區域網路（LAN）通常涵蓋範圍較小，如一棟建築物或校園內。",
    explanation_en: "A LAN typically covers a small area such as a single building or campus."
  },

  // ══════════════════════════════════════════════════
  // IP 位址與子網路 | IP Addressing & Subnetting
  // ══════════════════════════════════════════════════
  {
    id: 9,
    category: "IP 位址與子網路", category_en: "IP Addressing & Subnetting",
    question: "IPv4 位址共有多少位元（bits）？",
    question_en: "How many bits does an IPv4 address consist of?",
    options: ["16 bits","32 bits","64 bits","128 bits"],
    options_en: ["16 bits","32 bits","64 bits","128 bits"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "IPv4 位址由 32 個位元組成，分為 4 個八位組。",
    explanation_en: "An IPv4 address consists of 32 bits, divided into four octets."
  },
  {
    id: 10,
    category: "IP 位址與子網路", category_en: "IP Addressing & Subnetting",
    question: "下列哪一個 IP 位址屬於 Class B？",
    question_en: "Which of the following IP addresses belongs to Class B?",
    options: ["10.0.0.1","172.16.0.1","192.168.1.1","224.0.0.1"],
    options_en: ["10.0.0.1","172.16.0.1","192.168.1.1","224.0.0.1"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "Class B 的 IP 範圍為 128.0.0.0 ~ 191.255.255.255，172.16.0.1 屬於此範圍。",
    explanation_en: "Class B range is 128.0.0.0–191.255.255.255. 172.16.0.1 falls within this range."
  },
  {
    id: 11,
    category: "IP 位址與子網路", category_en: "IP Addressing & Subnetting",
    question: "子網路遮罩 255.255.255.0 以 CIDR 表示法為何？",
    question_en: "What is the CIDR notation for the subnet mask 255.255.255.0?",
    options: ["/16","/20","/24","/28"],
    options_en: ["/16","/20","/24","/28"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "255.255.255.0 表示前 24 個位元為網路位元，故 CIDR 表示為 /24。",
    explanation_en: "255.255.255.0 has 24 network bits, so the CIDR notation is /24."
  },
  {
    id: 12,
    category: "IP 位址與子網路", category_en: "IP Addressing & Subnetting",
    question: "以下何者為私有 IP 位址（Private IP Address）？",
    question_en: "Which of the following is a private IP address?",
    options: ["8.8.8.8","192.168.1.100","203.74.205.1","140.112.8.116"],
    options_en: ["8.8.8.8","192.168.1.100","203.74.205.1","140.112.8.116"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "192.168.0.0 ~ 192.168.255.255 為私有 IP 位址範圍。",
    explanation_en: "The range 192.168.0.0–192.168.255.255 is reserved for private IP addresses."
  },
  {
    id: 13,
    category: "IP 位址與子網路", category_en: "IP Addressing & Subnetting",
    question: "IPv6 位址由多少位元組成？",
    question_en: "How many bits does an IPv6 address consist of?",
    options: ["32 bits","64 bits","128 bits","256 bits"],
    options_en: ["32 bits","64 bits","128 bits","256 bits"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "IPv6 位址由 128 個位元組成，以十六進位表示。",
    explanation_en: "An IPv6 address is 128 bits long, written in hexadecimal notation."
  },
  {
    id: 14,
    category: "IP 位址與子網路", category_en: "IP Addressing & Subnetting",
    question: "下列何者為迴路位址（Loopback Address）？",
    question_en: "Which of the following is the IPv4 loopback address?",
    options: ["0.0.0.0","127.0.0.1","255.255.255.255","169.254.0.1"],
    options_en: ["0.0.0.0","127.0.0.1","255.255.255.255","169.254.0.1"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "127.0.0.1 為 IPv4 的迴路位址，用於測試本機網路功能。",
    explanation_en: "127.0.0.1 is the IPv4 loopback address, used to test the local network stack."
  },
  {
    id: 15,
    category: "IP 位址與子網路", category_en: "IP Addressing & Subnetting",
    question: "若一個網路使用 /28 的子網路遮罩，每個子網路最多可容納多少台主機？",
    question_en: "With a /28 subnet mask, how many usable host addresses does each subnet have?",
    options: ["6 台","14 台","30 台","62 台"],
    options_en: ["6 hosts","14 hosts","30 hosts","62 hosts"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "/28 表示有 4 個主機位元，2^4 - 2 = 14 台主機。",
    explanation_en: "/28 leaves 4 host bits. 2^4 − 2 = 14 usable host addresses."
  },
  {
    id: 16,
    category: "IP 位址與子網路", category_en: "IP Addressing & Subnetting",
    question: "NAT（Network Address Translation）的主要功能是什麼？",
    question_en: "What is the primary function of NAT (Network Address Translation)?",
    options: ["加密網路資料","將私有 IP 轉換為公有 IP","分配 IP 位址給用戶端","解析域名為 IP 位址"],
    options_en: ["Encrypt network data","Translate private IP to public IP","Assign IP addresses to clients","Resolve domain names to IP addresses"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "NAT 的主要功能是將內部私有 IP 轉換為外部公有 IP，以便存取網際網路。",
    explanation_en: "NAT translates internal private IPs to a public IP to allow internet access."
  },

  // ══════════════════════════════════════════════════
  // 網路設備與協定 | Network Devices & Protocols
  // ══════════════════════════════════════════════════
  {
    id: 17,
    category: "網路設備與協定", category_en: "Network Devices & Protocols",
    question: "下列哪一種網路設備運作在 OSI 模型的第二層？",
    question_en: "Which network device operates at OSI Layer 2?",
    options: ["集線器 (Hub)","交換器 (Switch)","路由器 (Router)","閘道器 (Gateway)"],
    options_en: ["Hub","Switch","Router","Gateway"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "交換器 (Switch) 運作在資料鏈結層 (Layer 2)，使用 MAC 位址進行資料轉送。",
    explanation_en: "A Switch operates at the Data Link Layer (Layer 2) and forwards frames using MAC addresses."
  },
  {
    id: 18,
    category: "網路設備與協定", category_en: "Network Devices & Protocols",
    question: "DHCP 伺服器的主要功能為何？",
    question_en: "What is the primary function of a DHCP server?",
    options: ["解析網域名稱","自動分配 IP 位址","過濾網路封包","轉送電子郵件"],
    options_en: ["Resolve domain names","Automatically assign IP addresses","Filter network packets","Forward email messages"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "DHCP 可自動分配 IP 位址、子網路遮罩等網路設定。",
    explanation_en: "DHCP automatically assigns IP addresses, subnet masks, and other network settings to clients."
  },
  {
    id: 19,
    category: "網路設備與協定", category_en: "Network Devices & Protocols",
    question: "DNS 伺服器主要將什麼轉換成 IP 位址？",
    question_en: "What does a DNS server primarily translate into an IP address?",
    options: ["MAC 位址","域名 (Domain Name)","連接埠號碼","協定名稱"],
    options_en: ["MAC address","Domain name","Port number","Protocol name"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "DNS 將人類可讀的域名轉換為電腦可讀的 IP 位址。",
    explanation_en: "DNS translates human-readable domain names into machine-readable IP addresses."
  },
  {
    id: 20,
    category: "網路設備與協定", category_en: "Network Devices & Protocols",
    question: "下列哪一個協定使用 UDP 連接埠 53？",
    question_en: "Which protocol uses UDP port 53?",
    options: ["HTTP","FTP","DNS","SMTP"],
    options_en: ["HTTP","FTP","DNS","SMTP"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "DNS 預設使用 UDP 連接埠 53 進行域名解析查詢。",
    explanation_en: "DNS uses UDP port 53 by default for name resolution queries."
  },
  {
    id: 21,
    category: "網路設備與協定", category_en: "Network Devices & Protocols",
    question: "以下哪個協定用於安全的網頁瀏覽？",
    question_en: "Which protocol is used for secure web browsing?",
    options: ["HTTP","FTP","HTTPS","Telnet"],
    options_en: ["HTTP","FTP","HTTPS","Telnet"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "HTTPS 使用 SSL/TLS 加密，提供安全的網頁瀏覽。",
    explanation_en: "HTTPS uses SSL/TLS encryption to provide secure web browsing."
  },
  {
    id: 22,
    category: "網路設備與協定", category_en: "Network Devices & Protocols",
    question: "ARP 協定的功能為何？",
    question_en: "What is the function of the ARP protocol?",
    options: ["將 IP 位址解析為 MAC 位址","將 MAC 位址解析為 IP 位址","將域名解析為 IP 位址","將 IP 位址解析為域名"],
    options_en: ["Resolve IP address to MAC address","Resolve MAC address to IP address","Resolve domain name to IP address","Resolve IP address to domain name"],
    answer: 0,
    imagePath: null, imageContext: null,
    explanation: "ARP 將已知的 IP 位址解析為對應的 MAC 位址。",
    explanation_en: "ARP (Address Resolution Protocol) resolves a known IP address to its corresponding MAC address."
  },
  {
    id: 23,
    category: "網路設備與協定", category_en: "Network Devices & Protocols",
    question: "下列何者為集線器 (Hub) 的特性？",
    question_en: "Which of the following describes a Hub's behavior?",
    options: ["可以過濾封包","將資料傳送到所有連接埠","根據 MAC 位址轉送資料","運作在 OSI 第三層"],
    options_en: ["Can filter packets","Broadcasts data to all ports","Forwards data based on MAC addresses","Operates at OSI Layer 3"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "集線器 (Hub) 運作在第一層，會將收到的資料廣播到所有連接埠。",
    explanation_en: "A Hub operates at Layer 1 and broadcasts received data to all connected ports."
  },
  {
    id: 24,
    category: "網路設備與協定", category_en: "Network Devices & Protocols",
    question: "SMTP 協定主要用於什麼服務？",
    question_en: "What service does the SMTP protocol primarily support?",
    options: ["網頁瀏覽","檔案傳輸","電子郵件傳送","遠端登入"],
    options_en: ["Web browsing","File transfer","Sending email","Remote login"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "SMTP (Simple Mail Transfer Protocol) 用於電子郵件的傳送。",
    explanation_en: "SMTP (Simple Mail Transfer Protocol) is used for sending email messages."
  },

  // ══════════════════════════════════════════════════
  // 網路安全 | Network Security
  // ══════════════════════════════════════════════════
  {
    id: 25,
    category: "網路安全", category_en: "Network Security",
    question: "下列何者是對稱式加密演算法？",
    question_en: "Which of the following is a symmetric encryption algorithm?",
    options: ["RSA","AES","Diffie-Hellman","ECC"],
    options_en: ["RSA","AES","Diffie-Hellman","ECC"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "AES 是對稱式加密演算法，加解密使用相同的金鑰。",
    explanation_en: "AES (Advanced Encryption Standard) is a symmetric algorithm — the same key is used for encryption and decryption."
  },
  {
    id: 26,
    category: "網路安全", category_en: "Network Security",
    question: "防火牆 (Firewall) 的主要功能為何？",
    question_en: "What is the primary function of a Firewall?",
    options: ["加速網路連線","過濾和控制網路流量","自動分配 IP 位址","壓縮傳輸資料"],
    options_en: ["Speed up network connections","Filter and control network traffic","Automatically assign IP addresses","Compress transmitted data"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "防火牆的主要功能是根據預設規則過濾和控制進出網路的流量。",
    explanation_en: "A firewall filters and controls incoming and outgoing network traffic based on predefined rules."
  },
  {
    id: 27,
    category: "網路安全", category_en: "Network Security",
    question: "下列何種攻擊是透過大量封包癱瘓目標伺服器？",
    question_en: "Which attack type overwhelms a target server with massive amounts of traffic?",
    options: ["SQL Injection","Phishing","DDoS","Man-in-the-Middle"],
    options_en: ["SQL Injection","Phishing","DDoS","Man-in-the-Middle"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "DDoS 攻擊透過大量封包使目標伺服器無法正常提供服務。",
    explanation_en: "A DDoS (Distributed Denial of Service) attack floods a server with traffic to make it unavailable."
  },
  {
    id: 28,
    category: "網路安全", category_en: "Network Security",
    question: "SSL/TLS 憑證主要用於？",
    question_en: "What is the primary purpose of SSL/TLS certificates?",
    options: ["驗證伺服器身份並加密傳輸","分配動態 IP 位址","管理電子郵件","監控網路流量"],
    options_en: ["Verify server identity and encrypt transmission","Assign dynamic IP addresses","Manage email","Monitor network traffic"],
    answer: 0,
    imagePath: null, imageContext: null,
    explanation: "SSL/TLS 憑證用於驗證伺服器身份，並建立加密的通訊通道。",
    explanation_en: "SSL/TLS certificates authenticate the server's identity and establish an encrypted communication channel."
  },
  {
    id: 29,
    category: "網路安全", category_en: "Network Security",
    question: "VPN 的主要功能是什麼？",
    question_en: "What is the primary function of a VPN?",
    options: ["提高網路速度","在公共網路上建立安全的私人連線","過濾垃圾郵件","管理資料庫"],
    options_en: ["Increase network speed","Create a secure private connection over a public network","Filter spam email","Manage databases"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "VPN 在公共網路上建立加密的安全通道。",
    explanation_en: "A VPN creates an encrypted secure tunnel over a public network."
  },
  {
    id: 30,
    category: "網路安全", category_en: "Network Security",
    question: "下列何者屬於社交工程攻擊（Social Engineering）？",
    question_en: "Which of the following is an example of a Social Engineering attack?",
    options: ["利用系統漏洞入侵","釣魚郵件騙取個人資料","暴力破解密碼","植入後門程式"],
    options_en: ["Exploiting a system vulnerability","Phishing email to steal personal information","Brute-force password cracking","Planting a backdoor program"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "社交工程是利用人的心理弱點來騙取資訊，釣魚郵件是典型例子。",
    explanation_en: "Social Engineering exploits human psychology. Phishing emails are a classic example."
  },
  {
    id: 31,
    category: "網路安全", category_en: "Network Security",
    question: "WPA3 是用於哪種網路的安全協定？",
    question_en: "WPA3 is a security protocol used for which type of network?",
    options: ["有線區域網路","無線區域網路","廣域網路","虛擬私人網路"],
    options_en: ["Wired LAN","Wireless LAN (Wi-Fi)","Wide Area Network","Virtual Private Network"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "WPA3 是最新的無線區域網路安全協定，提供更強的加密保護。",
    explanation_en: "WPA3 is the latest Wi-Fi security protocol, providing stronger encryption."
  },
  {
    id: 32,
    category: "網路安全", category_en: "Network Security",
    question: "數位簽章的主要目的為何？",
    question_en: "What is the primary purpose of a digital signature?",
    options: ["加密資料內容","驗證資料來源與完整性","壓縮檔案大小","加速資料傳輸"],
    options_en: ["Encrypt data content","Verify data origin and integrity","Compress file size","Speed up data transmission"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "數位簽章用於驗證資料的來源（不可否認性）和完整性。",
    explanation_en: "A digital signature verifies data origin (non-repudiation) and ensures data integrity."
  },

  // ══════════════════════════════════════════════════
  // 無線網路與行動通訊 | Wireless & Mobile
  // ══════════════════════════════════════════════════
  {
    id: 33,
    category: "無線網路與行動通訊", category_en: "Wireless & Mobile Communications",
    question: "Wi-Fi 6 的 IEEE 標準代號為何？",
    question_en: "What is the IEEE standard number for Wi-Fi 6?",
    options: ["802.11n","802.11ac","802.11ax","802.11be"],
    options_en: ["802.11n","802.11ac","802.11ax","802.11be"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "Wi-Fi 6 的 IEEE 標準代號為 802.11ax。",
    explanation_en: "Wi-Fi 6 is standardized as IEEE 802.11ax."
  },
  {
    id: 34,
    category: "無線網路與行動通訊", category_en: "Wireless & Mobile Communications",
    question: "藍牙（Bluetooth）通常用於哪種類型的網路？",
    question_en: "Bluetooth is typically used for which type of network?",
    options: ["WAN（廣域網路）","LAN（區域網路）","PAN（個人區域網路）","MAN（都會區域網路）"],
    options_en: ["WAN (Wide Area Network)","LAN (Local Area Network)","PAN (Personal Area Network)","MAN (Metropolitan Area Network)"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "藍牙主要用於短距離的個人區域網路 (PAN) 通訊。",
    explanation_en: "Bluetooth is primarily used for short-range Personal Area Network (PAN) communication."
  },
  {
    id: 35,
    category: "無線網路與行動通訊", category_en: "Wireless & Mobile Communications",
    question: "5G 行動通訊的主要特性不包括下列何者？",
    question_en: "Which of the following is NOT a primary feature of 5G mobile communications?",
    options: ["超高速度","超低延遲","僅支援語音通話","大量設備連線"],
    options_en: ["Ultra-high speed","Ultra-low latency","Voice calls only","Massive device connectivity"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "5G 的特性包括高速度、低延遲、大量設備連線，並非僅支援語音通話。",
    explanation_en: "5G features high speed, low latency, and massive connectivity. It is not limited to voice calls."
  },
  {
    id: 36,
    category: "無線網路與行動通訊", category_en: "Wireless & Mobile Communications",
    question: "無線網路中的 SSID 代表什麼？",
    question_en: "What does SSID stand for in wireless networking?",
    options: ["無線網路的加密金鑰","無線網路的名稱識別碼","無線網路的 IP 位址","無線網路的頻率"],
    options_en: ["The wireless encryption key","The wireless network name identifier","The wireless network IP address","The wireless network frequency"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "SSID (Service Set Identifier) 是無線網路的名稱，用於識別不同的無線網路。",
    explanation_en: "SSID (Service Set Identifier) is the name of a wireless network used to identify it."
  },
  {
    id: 37,
    category: "無線網路與行動通訊", category_en: "Wireless & Mobile Communications",
    question: "下列何者不是無線網路常用的頻段？",
    question_en: "Which of the following is NOT a commonly used Wi-Fi frequency band?",
    options: ["2.4 GHz","5 GHz","6 GHz","10 GHz"],
    options_en: ["2.4 GHz","5 GHz","6 GHz","10 GHz"],
    answer: 3,
    imagePath: null, imageContext: null,
    explanation: "Wi-Fi 常用頻段為 2.4 GHz、5 GHz 和 6 GHz（Wi-Fi 6E），10 GHz 不是常用頻段。",
    explanation_en: "Common Wi-Fi bands are 2.4 GHz, 5 GHz, and 6 GHz (Wi-Fi 6E). 10 GHz is not a standard Wi-Fi band."
  },
  {
    id: 38,
    category: "無線網路與行動通訊", category_en: "Wireless & Mobile Communications",
    question: "NFC（Near Field Communication）的通訊距離約為多少？",
    question_en: "What is the typical communication range of NFC (Near Field Communication)?",
    options: ["10 公尺","100 公尺","10 公分","1 公里"],
    options_en: ["10 meters","100 meters","10 centimeters","1 kilometer"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "NFC 的通訊距離非常短，通常在 10 公分以內。",
    explanation_en: "NFC has a very short range, typically within 10 centimeters."
  },

  // ══════════════════════════════════════════════════
  // 網際網路應用服務 | Internet Application Services
  // ══════════════════════════════════════════════════
  {
    id: 39,
    category: "網際網路應用服務", category_en: "Internet Application Services",
    question: "雲端運算的三種服務模式不包括下列何者？",
    question_en: "Which of the following is NOT one of the three main cloud computing service models?",
    options: ["IaaS（基礎設施即服務）","PaaS（平台即服務）","SaaS（軟體即服務）","NaaS（網路即服務）"],
    options_en: ["IaaS (Infrastructure as a Service)","PaaS (Platform as a Service)","SaaS (Software as a Service)","NaaS (Network as a Service)"],
    answer: 3,
    imagePath: null, imageContext: null,
    explanation: "雲端運算的三種主要服務模式為 IaaS、PaaS、SaaS。",
    explanation_en: "The three main cloud service models are IaaS, PaaS, and SaaS."
  },
  {
    id: 40,
    category: "網際網路應用服務", category_en: "Internet Application Services",
    question: "下列何者是用來追蹤使用者在網站上行為的技術？",
    question_en: "Which technology is used to track user behavior on a website?",
    options: ["Cookie","Firewall","Proxy","DNS"],
    options_en: ["Cookie","Firewall","Proxy","DNS"],
    answer: 0,
    imagePath: null, imageContext: null,
    explanation: "Cookie 是網站儲存在使用者瀏覽器中的小型資料，用於追蹤和記錄使用者行為。",
    explanation_en: "Cookies are small pieces of data stored in the user's browser to track and record behavior."
  },
  {
    id: 41,
    category: "網際網路應用服務", category_en: "Internet Application Services",
    question: "FTP 協定預設使用哪兩個連接埠？",
    question_en: "Which two ports does FTP use by default?",
    options: ["20 和 21","22 和 23","80 和 443","25 和 110"],
    options_en: ["20 and 21","22 and 23","80 and 443","25 and 110"],
    answer: 0,
    imagePath: null, imageContext: null,
    explanation: "FTP 使用連接埠 20（資料傳輸）和連接埠 21（控制連線）。",
    explanation_en: "FTP uses port 20 for data transfer and port 21 for control connections."
  },
  {
    id: 42,
    category: "網際網路應用服務", category_en: "Internet Application Services",
    question: "IoT（物聯網）的主要特性為何？",
    question_en: "What is the core concept of IoT (Internet of Things)?",
    options: ["僅連接電腦設備","將各種物理設備連接到網路","僅用於工業控制","需要人工操控每個設備"],
    options_en: ["Only connects computer devices","Connects physical devices to the internet","Used only for industrial control","Requires manual control of each device"],
    answer: 1,
    imagePath: null, imageContext: null,
    explanation: "IoT 的核心概念是將各種物理設備透過網路互相連接，實現智慧化管理。",
    explanation_en: "IoT connects various physical devices through the internet to enable intelligent management."
  },
  {
    id: 43,
    category: "網際網路應用服務", category_en: "Internet Application Services",
    question: "電子郵件接收通常使用下列哪個協定？",
    question_en: "Which protocol is commonly used to receive email?",
    options: ["SMTP","HTTP","POP3/IMAP","FTP"],
    options_en: ["SMTP","HTTP","POP3/IMAP","FTP"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "POP3 和 IMAP 是用於接收電子郵件的協定，SMTP 則用於傳送。",
    explanation_en: "POP3 and IMAP are used to receive email; SMTP is used to send it."
  },
  {
    id: 44,
    category: "網際網路應用服務", category_en: "Internet Application Services",
    question: "下列何者不是搜尋引擎優化 (SEO) 的技術？",
    question_en: "Which of the following is NOT an SEO (Search Engine Optimization) technique?",
    options: ["關鍵字研究","網站速度優化","DDoS 攻擊","優質內容建立"],
    options_en: ["Keyword research","Website speed optimization","DDoS attack","Quality content creation"],
    answer: 2,
    imagePath: null, imageContext: null,
    explanation: "DDoS 攻擊是一種網路攻擊行為，與搜尋引擎優化無關。",
    explanation_en: "A DDoS attack is a cyberattack, completely unrelated to search engine optimization."
  }
];

// Merge with questions parsed from material1.pdf
// PDF_QUESTIONS is loaded from data/questions_pdf.js (loaded after this file in HTML)
function buildQuestionBank() {
  if (typeof PDF_QUESTIONS !== 'undefined') {
    return [...QUESTION_BANK, ...PDF_QUESTIONS];
  }
  return QUESTION_BANK;
}

// Will be overwritten after PDF script loads — see init()
let ALL_QUESTIONS    = QUESTION_BANK;
const CATEGORIES     = [...new Set(QUESTION_BANK.map(q => q.category))];
const CATEGORIES_EN  = [...new Set(QUESTION_BANK.map(q => q.category_en))];

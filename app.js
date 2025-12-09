const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const sql = require("mssql");
const nodemailer = require("nodemailer");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

app.use(session({
  secret: "mysecretkey",
  resave: false,
  saveUninitialized: true
}));

// ---------- SQL Server config ----------
const config = {
  user: 'sa',
  password: 'Tritg0hk1',
  server: 'DESKTOP-SGH1OM5',
  database: 'MyWebsiteDB',
  options: { encrypt: true, trustServerCertificate: true }
};


let etherealTransporter = null;

// --- Route สำหรับสร้าง Ethereal account ---
app.post("/create-ethereal", async (req, res) => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    etherealTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });

    console.log("Ethereal account created:", testAccount.user);
    res.json({ success: true, message: "Ethereal account ready", user: testAccount.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "ไม่สามารถสร้าง Ethereal account ได้" });
  }
});



// ---------- ฟังก์ชันส่ง OTP ----------
async function sendOTP(email, otp) {
  if (!etherealTransporter) {
    console.log("ยังไม่มี Ethereal account! สร้างก่อนกด register");
    return;
  }

  try {
    const info = await etherealTransporter.sendMail({
      from: '"MyWebsite Test" <no-reply@example.com>',
      to: email,
      subject: "รหัส OTP ของคุณ (ทดสอบ)",
      text: `รหัส OTP ของคุณคือ: ${otp}`
    });

    console.log(`OTP for ${email}: ${otp}`);
    console.log("OTP sent! Preview URL:", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("ส่ง OTP ไม่สำเร็จ:", err);
  }
}



// ---------- หน้า index ----------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------- REGISTER ----------
app.post("/register", async (req, res) => {
  const { username, email, password, fullname } = req.body;
  if (!username || !email || !password || !fullname) {
    return res.json({ success: false, message: "กรอกข้อมูลให้ครบทุกช่อง" });
  }

  // --- connect SQL และ insert แบบปกติ ---
  const pool = await sql.connect(config);

  const check = await pool.request()
    .input("username", sql.NVarChar, username)
    .input("email", sql.NVarChar, email)
    .query("SELECT * FROM dbo.Users WHERE Username=@username OR Email=@email");

  if (check.recordset.length > 0) {
    return res.json({ success: false, message: "Username หรือ Email นี้ถูกใช้แล้ว" });
  }

  const hash = await bcrypt.hash(password, 10);

  await pool.request()
    .input("username", sql.NVarChar, username)
    .input("email", sql.NVarChar, email)
    .input("passwordHash", sql.NVarChar, hash)
    .input("fullname", sql.NVarChar, fullname)
    .query("INSERT INTO dbo.Users (Username, Email, PasswordHash, FullName, CreatedAt) VALUES (@username,@email,@passwordHash,@fullname,GETDATE())");

  // ---------- สร้าง OTP ----------
  const otp = Math.floor(100000 + Math.random() * 900000);
  req.session.otp = { code: otp, email };

  // ส่ง OTP ผ่าน Ethereal (ถ้ามี)
  await sendOTP(email, otp);

  res.json({ success: true, message: "สมัครสมาชิกเรียบร้อย! ตรวจสอบ OTP ในอีเมลาของคุณ (ทดสอบ)" });
});


// ---------- VERIFY OTP ----------
app.post("/verify-otp", (req, res) => {
  const { otp } = req.body;
  if (!req.session.otp) return res.json({ success: false, message: "ไม่มี OTP ในระบบ" });

  if (parseInt(otp) === req.session.otp.code) {
    delete req.session.otp;
    res.json({ success: true, message: "OTP ถูกต้อง" });
  } else {
    res.json({ success: false, message: "รหัส OTP ไม่ถูกต้อง" });
  }
});

// ---------- LOGIN ----------
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.json({ success: false, message: "กรอกข้อมูลให้ครบทุกช่อง" });

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("username", sql.NVarChar, username)
      .query("SELECT * FROM dbo.Users WHERE Username=@username OR Email=@username");

    const user = result.recordset[0];
    if (!user) return res.json({ success: false, message: "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง" });

    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match) return res.json({ success: false, message: "ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง" });

    req.session.user = { username: user.Username, fullname: user.FullName };
    res.json({ success: true, message: `ยินดีต้อนรับ ${user.FullName}` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ---------- LOGOUT ----------
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.json({ success: false, message: "ไม่สามารถ logout ได้" });
    res.clearCookie('connect.sid');
    res.json({ success: true, message: "ออกจากระบบเรียบร้อย" });
  });
});

// ---------- Middleware ตรวจสอบ login ----------
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login.html");
  res.set('Cache-Control', 'no-store');
  next();
}

// ---------- หน้า exercises ----------
app.get("/exercises/:file", requireLogin, (req, res) => {
  const filePath = path.join(__dirname, "private", "exercises", req.params.file);
  res.sendFile(filePath);
});

// ---------- ข้อมูลผู้ใช้ ----------
app.get("/me", (req, res) => {
  if (req.session && req.session.user) res.json(req.session.user);
  else res.json({});
});

// ---------- เริ่ม server ----------

const { exec } = require("child_process");

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");

  // เปิด browser ด้วยคำสั่ง start (เฉพาะ Windows)
  exec('start http://localhost:3000');
});





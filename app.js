const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt"); // สำหรับเข้ารหัสรหัสผ่าน
const session = require("express-session"); // <-- เพิ่ม

const app = express();
app.use(express.json()); // อ่าน JSON body
app.use(express.static(__dirname)); 


// ตั้งค่า session
app.use(session({
  secret: "mysecretkey",    // เปลี่ยนเป็นรหัสลับของคุณ
  resave: false,
  saveUninitialized: true
}));



const USERS_FILE = path.join(__dirname, "users.json");

// หน้า index
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Register
app.post("/register", async (req, res) => {
  const { username, password, fullname } = req.body;
  if (!username || !password || !fullname) {
    return res.json({ success: false, message: "กรอกข้อมูลให้ครบทุกช่อง" });
  }

  // อ่านไฟล์ผู้ใช้
  let users = JSON.parse(fs.readFileSync(USERS_FILE));

  // ตรวจสอบ username ซ้ำ
  if (users.find(u => u.username === username)) {
    return res.json({ success: false, message: "Username นี้มีคนใช้แล้ว" });
  }

  // เข้ารหัส password
  const hash = await bcrypt.hash(password, 10);

  // เพิ่มผู้ใช้ใหม่
  users.push({ username, passwordHash: hash, fullname });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  res.json({ success: true, message: "สมัครสมาชิกเรียบร้อย" });
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ success: false, message: "กรอกข้อมูลให้ครบทุกช่อง" });
  }

  let users = JSON.parse(fs.readFileSync(USERS_FILE));
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.json({ success: false, message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
  }

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: "ไม่สามารถ logout ได้" });
    }
    res.clearCookie('connect.sid'); // สำคัญ
    res.json({ success: true, message: "ออกจากระบบเรียบร้อย" });
  });
});


  // เซฟข้อมูล user ลง session
  req.session.user = { username: user.username, fullname: user.fullname };
  res.json({ success: true, message: `ยินดีต้อนรับ ${user.fullname}` });
});

// 🔹 Middleware ตรวจสอบ login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  // ป้องกัน browser cache หน้าเก่า
  res.set('Cache-Control', 'no-store');
  next();
}

// ป้องกันทุกไฟล์ใน /exercises
app.get("/exercises/:file", requireLogin, (req, res) => {
  const filePath = path.join(__dirname, "private", "exercises", req.params.file);
  res.sendFile(filePath);
});

app.get("/me", (req, res) => {
    if (req.session && req.session.user) {
        res.json(req.session.user);
    } else {
        res.json({});
    }
});


// เริ่ม server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));

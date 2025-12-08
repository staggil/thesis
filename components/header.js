// ตรวจสอบ login status
const username = localStorage.getItem("username");
if(username){
    document.querySelectorAll(".user-only").forEach(el => el.style.display = "block");
    document.getElementById("username-display").textContent = username;
    document.querySelectorAll(".login-only").forEach(el => el.style.display = "none");
} else {
    document.querySelectorAll(".user-only").forEach(el => el.style.display = "none");
    document.querySelectorAll(".login-only").forEach(el => el.style.display = "block");
}

// logout
const logoutLink = document.getElementById("logout-link");
if(logoutLink){
    logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("username");      // ลบ session local
        document.querySelectorAll(".user-only").forEach(el => el.style.display = "none");
        document.querySelectorAll(".login-only").forEach(el => el.style.display = "block");
        window.location.href = "/login.html";    // redirect ไปหน้า login
    });
}

async function updateHeader() {
    try {
        // ตรวจสอบว่า login แล้วหรือยัง (เราต้องมี route /me ที่คืน user info ถ้า login)
        const res = await fetch("/me");
        let user;
        if (res.ok) {
            user = await res.json();
        }

        if (user && user.username) {
            // แสดง user-only
            document.querySelectorAll(".user-only").forEach(el => el.style.display = "block");
            document.querySelectorAll(".login-only").forEach(el => el.style.display = "none");

            const usernameDisplay = document.getElementById("username-display");
            if (usernameDisplay) usernameDisplay.textContent = user.fullname;

            // ตั้ง event logout
            const logoutLink = document.getElementById("logout-link");
            if (logoutLink) {
                logoutLink.addEventListener("click", async (e) => {
                    e.preventDefault();
                    await fetch("/logout", { method: "POST" });
                    // redirect ไป login
                    window.location.href = "/login.html";
                });
            }

        } else {
            // ถ้าไม่ login
            document.querySelectorAll(".user-only").forEach(el => el.style.display = "none");
            document.querySelectorAll(".login-only").forEach(el => el.style.display = "block");
        }

    } catch (err) {
        console.error("Cannot update header:", err);
    }
}

// เรียกตอนโหลด header เสร็จ
updateHeader();
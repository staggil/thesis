function loadComponent(filePath, elementId) {
    if (!filePath) return;
    const el = document.getElementById(elementId);
    if (!el) {
        console.error(`ไม่พบ element id="${elementId}"`);
        return;
    }
    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error("ไม่พบไฟล์ " + filePath);
            return response.text();
        })
        .then(data => {
            el.innerHTML = data;

            // หลังโหลด header ให้ตรวจสอบ session
            if (elementId === "header-placeholder") {
                updateHeaderLoginStatus();
            }
        })
        .catch(error => console.error(error));
}

// ฟังก์ชันตรวจสอบ login
function updateHeaderLoginStatus() {
    fetch("/me")
        .then(res => res.json())
        .then(user => {
            if (user.username) {
                // login แล้ว
                document.querySelectorAll(".login-only").forEach(el => el.style.display = "none");
                document.querySelectorAll(".user-only").forEach(el => el.style.display = "block");
                document.getElementById("username-display").textContent = user.fullname;

                // เพิ่ม listener logout
                const logoutLink = document.getElementById("logout-link");
                if (logoutLink) {
                    logoutLink.addEventListener("click", async (e) => {
                        e.preventDefault();
                        await fetch("/logout", { method: "POST" });
                        updateHeaderLoginStatus(); // รีเฟรชเมนู
                        window.location.href = "/login.html";
                    });
                }

            } else {
                // ยังไม่ได้ login
                document.querySelectorAll(".login-only").forEach(el => el.style.display = "block");
                document.querySelectorAll(".user-only").forEach(el => el.style.display = "none");
            }
        })
        .catch(err => console.error(err));
}

document.addEventListener("DOMContentLoaded", function() {
    loadComponent("/components/header.html", "header-placeholder");
    loadComponent("/components/footer.html", "footer-placeholder");

    const sidebarFile = document.body.getAttribute("data-sidebar");
    loadComponent(sidebarFile, "sidebar-placeholder");
});

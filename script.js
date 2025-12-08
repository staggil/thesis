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
        })
        .catch(error => console.error(error));
}

document.addEventListener("DOMContentLoaded", function() {
    loadComponent("/components/header.html", "header-placeholder");
    loadComponent("/components/footer.html", "footer-placeholder");

    const sidebarFile = document.body.getAttribute("data-sidebar");
    loadComponent(sidebarFile, "sidebar-placeholder");
});

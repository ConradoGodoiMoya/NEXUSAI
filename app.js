document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggleSidebar");
  const openSidebar = document.getElementById("openSidebar");

  if (toggleSidebar && sidebar) {
    toggleSidebar.addEventListener("click", () => {
      sidebar.style.display = sidebar.style.display === "none" ? "flex" : "none";
    });
  }

  if (openSidebar && sidebar) {
    openSidebar.addEventListener("click", () => {
      sidebar.style.display = "flex";
    });
  }
});
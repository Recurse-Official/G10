document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');

    if (sidebar && content) {
        // Start with sidebar collapsed
        sidebar.classList.add('collapsed');
        content.classList.add('sidebar-collapsed');

        // Hover expand logic
        sidebar.addEventListener('mouseenter', () => {
            sidebar.classList.remove('collapsed');
            content.classList.remove('sidebar-collapsed');
        });

        sidebar.addEventListener('mouseleave', () => {
            sidebar.classList.add('collapsed');
            content.classList.add('sidebar-collapsed');
        });
    }
});
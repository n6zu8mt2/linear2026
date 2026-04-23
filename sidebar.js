// 修正版 sidebar.js
document.addEventListener('DOMContentLoaded', function() {
    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    if (sidebarPlaceholder) {
        // data-root-path を取得（例：サブフォルダのページなら "../"）
        const pathPrefix = sidebarPlaceholder.getAttribute('data-root-path') || './';

        fetch(pathPrefix + 'sidebar.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Sidebar not found');
                }
                return response.text();
            })
            .then(data => {
                // サイドバーを挿入
                sidebarPlaceholder.innerHTML = data;

                // ▼▼▼ ここでリンクを補正する処理を追加 ▼▼▼
                const links = sidebarPlaceholder.querySelectorAll('a');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    // 外部リンク（http...）ではなく、かつ相対パス（./）で始まっている場合
                    if (href && href.startsWith('./')) {
                        // href="./index.html" を href="../index.html" のように書き換える
                        link.setAttribute('href', pathPrefix + href.substring(2));
                    }
                });
                // ▲▲▲ 補正処理ここまで ▲▲▲
            })
            .catch(error => {
                console.error('Error loading sidebar:', error);
                sidebarPlaceholder.innerHTML = '<p style="color:red;">Sidebar could not be loaded.</p>';
            });
    }
});
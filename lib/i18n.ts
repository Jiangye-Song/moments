export type Language = "en" | "zh-CN" | "zh-TW" | "ja"

export const languageNames: Record<Language, string> = {
  "en": "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  "ja": "日本語",
}

export const translations = {
  "en": {
    // Header
    "moments": "Iris",
    "searchPosts": "Search posts...",
    "filteringBy": "Filtering by:",
    
    // Post interactions
    "like": "Like",
    "comment": "Comment",
    "reply": "Reply",
    "writeComment": "Write a comment...",
    "writeReply": "Write a reply...",
    "replyTo": "Reply to",
    "replyingTo": "Replying to",
    
    // Username dialog
    "welcome": "Welcome!",
    "enterNameToInteract": "Enter your username to interact with posts",
    "usernameTip": "No password required! But there's no direct way to change your username after login, so choose wisely.",
    "yourName": "Your Username",
    "enterYourName": "Enter your username",
    "cancel": "Cancel",
    "continue": "Continue",
    "checking": "Checking...",
    "verifyingName": "Verifying your username",
    "nameAlreadyUsed": "Username Already Used",
    "nameUsedBefore": "has been used somewhere in this site.",
    "nameUsedDescription": "You may ignore this message and continue if this is your username. Otherwise, a different username is recommended to avoid confusion.",
    "chooseDifferentName": "Choose Different Name",
    "continueAnyway": "Continue Anyway",
    "nameUnavailable": "Name Unavailable",
    "nameUnavailableDescription": "is not available for use.",
    "nameUnavailableSuggestion": "Please choose a different username.",
    
    // Feed
    "connectionError": "Connection Error",
    "checkInternet": "Please check your internet connection",
    "tryAgain": "Try Again",
    "noResultsFound": "No results found",
    "noPostsMatching": "No posts matching",
    "noPostsWith": "No posts with",
    "clearFilter": "Clear filter",
    "noMomentsYet": "No moments yet",
    "checkBackSoon": "Check back soon for new updates",
    "loadingMore": "Loading more...",
    "reachedEnd": "You've reached the end",
    
    // Likes
    "alreadyLiked": "You have already liked this post",
    
    // Time
    "justNow": "Just now",
    "mAgo": "m ago",
    "hAgo": "h ago",
    "dAgo": "d ago",
    
    // Language
    "language": "Language",
    
    // Theme
    "settings": "Settings",
    "theme": "Theme",
    "light": "Light",
    "dark": "Dark",
    "system": "System",
    
    // Maintenance
    "underMaintenance": "Under Maintenance",
    "maintenanceMessage": "Check back later!",

    // Photo viewer
    "resetZoom": "Reset Zoom",

    // Admin
    "adminLogin": "Admin Login", "setUpAdminAccess": "Set Up Admin Access", "createPasscodeSecure": "Create a passcode to secure your admin panel", "enterPasscodeAccess": "Enter your passcode to access the admin panel", "newPasscode": "New Passcode", "passcode": "Passcode", "confirmPasscode": "Confirm Passcode", "enterPasscode": "Enter passcode", "confirmPasscodePlaceholder": "Confirm passcode", "settingUp": "Setting up...", "loggingIn": "Logging in...", "createPasscode": "Create Passcode", "login": "Login", "posts": "Posts", "create": "Create", "profile": "Profile", "security": "Security", "managePosts": "Manage Posts", "noPostsYetAdmin": "No posts yet. Create your first post!", "allPostsLoaded": "All posts loaded", "deletePost": "Delete Post", "deletePostConfirm": "Are you sure you want to delete this post? This action cannot be undone.", "delete": "Delete", "deleting": "Deleting...", "profileSettings": "Profile Settings", "customizeProfile": "Customize your profile picture, banner, and display name", "bannerImage": "Banner Image", "profilePicture": "Profile Picture", "uploadProfilePicture": "Click to upload a new profile picture", "displayName": "Display Name", "enterDisplayName": "Enter your display name", "saveChanges": "Save Changes", "saving": "Saving...", "accentColor": "Accent Color", "chooseAccentColor": "Choose the primary accent color for buttons, links, and highlights", "maintenanceMode": "Maintenance Mode", "protectedMode": "Protected Mode", "changePasscode": "Change Passcode", "currentPasscode": "Current Passcode", "enterCurrentPasscode": "Enter current passcode", "enterNewPasscode": "Enter new passcode", "confirmNewPasscode": "Confirm New Passcode", "changing": "Changing...", "publicUsername": "Public Username", "username": "Username", "save": "Save", "clearUsername": "Clear Username", "specialUsernames": "Special Usernames", "add": "Add", "logout": "Logout",
  },
  "zh-CN": {
    // Header
    "moments": "瞳映",
    "searchPosts": "搜索瞬间...",
    "filteringBy": "筛选中：",
    
    // Post interactions
    "like": "赞！",
    "comment": "评论",
    "reply": "回复",
    "writeComment": "写评论...",
    "writeReply": "写回复...",
    "replyTo": "回复",
    "replyingTo": "正在回复",
    
    // Username dialog
    "welcome": "欢迎！",
    "enterNameToInteract": "输入您的用户名以互动",
    "usernameTip": "无需密码！但用户名设定后无直接方法修改，请谨慎选择。",
    "yourName": "您的用户名",
    "enterYourName": "输入您的用户名",
    "cancel": "取消",
    "continue": "继续",
    "checking": "检查中...",
    "verifyingName": "正在验证您的用户名",
    "nameAlreadyUsed": "用户名已被使用",
    "nameUsedBefore": "之前已被使用过。",
    "nameUsedDescription": "若这是您的用户名，则可以忽略这条消息并继续。否则，建议选择其他用户名以避免混淆。",
    "chooseDifferentName": "选择其他名字",
    "continueAnyway": "仍要使用",
    "nameUnavailable": "名称不可用",
    "nameUnavailableDescription": "无法使用。",
    "nameUnavailableSuggestion": "请选择其他用户名。",
    
    // Feed
    "connectionError": "连接错误",
    "checkInternet": "请检查您的网络连接",
    "tryAgain": "重试",
    "noResultsFound": "未找到结果",
    "noPostsMatching": "没有匹配的动态",
    "noPostsWith": "没有带有",
    "clearFilter": "清除筛选",
    "noMomentsYet": "暂无动态",
    "checkBackSoon": "请稍后再来查看更新",
    "loadingMore": "加载更多...",
    "reachedEnd": "已经到底了",
    
    // Likes
    "alreadyLiked": "您已经点赞过此动态",
    
    // Time
    "justNow": "刚刚",
    "mAgo": "分钟前",
    "hAgo": "小时前",
    "dAgo": "天前",
    
    // Language
    "language": "语言",
    
    // Theme
    "settings": "设置",
    "theme": "主题",
    "light": "浅色",
    "dark": "深色",
    "system": "跟随系统",
    
    // Maintenance
    "underMaintenance": "维护中",
    "maintenanceMessage": "请稍后再来！",

    // Photo viewer
    "resetZoom": "重置缩放",

    // Admin
    "adminLogin": "管理员登录", "setUpAdminAccess": "设置管理员访问", "createPasscodeSecure": "创建密码以保护管理面板", "enterPasscodeAccess": "输入密码以访问管理面板", "newPasscode": "新密码", "passcode": "密码", "confirmPasscode": "确认密码", "enterPasscode": "输入密码", "confirmPasscodePlaceholder": "确认密码", "settingUp": "设置中...", "loggingIn": "登录中...", "createPasscode": "创建密码", "login": "登录", "posts": "动态", "create": "创建", "profile": "个人资料", "security": "安全", "managePosts": "管理动态", "noPostsYetAdmin": "暂无动态。创建您的第一条动态吧！", "allPostsLoaded": "所有动态已加载", "deletePost": "删除动态", "deletePostConfirm": "确定要删除此动态吗？此操作无法撤销。", "delete": "删除", "deleting": "删除中...", "profileSettings": "个人资料设置", "customizeProfile": "自定义头像、横幅和显示名称", "bannerImage": "横幅图片", "profilePicture": "头像", "uploadProfilePicture": "点击上传新的头像", "displayName": "显示名称", "enterDisplayName": "输入显示名称", "saveChanges": "保存更改", "saving": "保存中...", "accentColor": "强调色", "chooseAccentColor": "选择按钮、链接和高亮的主要强调色", "maintenanceMode": "维护模式", "protectedMode": "保护模式", "changePasscode": "更改密码", "currentPasscode": "当前密码", "enterCurrentPasscode": "输入当前密码", "enterNewPasscode": "输入新密码", "confirmNewPasscode": "确认新密码", "changing": "更改中...", "publicUsername": "公开用户名", "username": "用户名", "save": "保存", "clearUsername": "清除用户名", "specialUsernames": "特殊用户名", "add": "添加", "logout": "退出登录",
  },
  "zh-TW": {
    // Header
    "moments": "瞳映",
    "searchPosts": "搜尋瞬間...",
    "filteringBy": "篩選：",
    
    // Post interactions
    "like": "讚！",
    "comment": "留言",
    "reply": "回覆",
    "writeComment": "寫留言...",
    "writeReply": "寫回覆...",
    "replyTo": "回覆",
    "replyingTo": "正在回覆",
    
    // Username dialog
    "welcome": "歡迎！",
    "enterNameToInteract": "輸入您的用戶名以互動",
    "usernameTip": "無需密碼！但用戶名設定後無法直接更改，請謹慎選擇。",
    "yourName": "您的用戶名",
    "enterYourName": "輸入您的用戶名",
    "cancel": "取消",
    "continue": "繼續",
    "checking": "檢查中...",
    "verifyingName": "正在驗證您的用戶名",
    "nameAlreadyUsed": "用戶名已被使用",
    "nameUsedBefore": "之前已被他人使用。",
    "nameUnavailable": "名稱無法使用",
    "nameUnavailableDescription": "無法使用。",
    "nameUnavailableSuggestion": "請選擇其他用戶名。",
    "nameUsedDescription": "如果這是您的用戶名，可以忽略此消息並繼續。否則，建議選擇其他名字以避免混淆。",
    "chooseDifferentName": "選擇其他名字",
    "continueAnyway": "繼續使用",
    
    // Feed
    "connectionError": "連線錯誤",
    "checkInternet": "請檢查您的網路連線",
    "tryAgain": "重試",
    "noResultsFound": "未找到結果",
    "noPostsMatching": "沒有符合的動態",
    "noPostsWith": "沒有帶有",
    "clearFilter": "清除篩選",
    "noMomentsYet": "暫無動態",
    "checkBackSoon": "請稍後再來查看更新",
    "loadingMore": "載入更多...",
    "reachedEnd": "已經到底了",
    
    // Likes
    "alreadyLiked": "您已經按讚過此動態",
    
    // Time
    "justNow": "剛剛",
    "mAgo": "分鐘前",
    "hAgo": "小時前",
    "dAgo": "天前",
    
    // Language
    "language": "語言",
    
    // Theme
    "settings": "設定",
    "theme": "主題",
    "light": "淺色",
    "dark": "深色",
    "system": "跟隨系統",
    
    // Maintenance
    "underMaintenance": "維護中",
    "maintenanceMessage": "請稍後再來！",

    // Photo viewer
    "resetZoom": "重置縮放",

    // Admin
    "adminLogin": "管理員登入", "setUpAdminAccess": "設定管理員存取", "createPasscodeSecure": "建立密碼以保護管理面板", "enterPasscodeAccess": "輸入密碼以存取管理面板", "newPasscode": "新密碼", "passcode": "密碼", "confirmPasscode": "確認密碼", "enterPasscode": "輸入密碼", "confirmPasscodePlaceholder": "確認密碼", "settingUp": "設定中...", "loggingIn": "登入中...", "createPasscode": "建立密碼", "login": "登入", "posts": "動態", "create": "建立", "profile": "個人資料", "security": "安全", "managePosts": "管理動態", "noPostsYetAdmin": "暫無動態。建立您的第一則動態吧！", "allPostsLoaded": "所有動態已載入", "deletePost": "刪除動態", "deletePostConfirm": "確定要刪除此動態嗎？此操作無法復原。", "delete": "刪除", "deleting": "刪除中...", "profileSettings": "個人資料設定", "customizeProfile": "自訂頭像、橫幅和顯示名稱", "bannerImage": "橫幅圖片", "profilePicture": "頭像", "uploadProfilePicture": "點擊上傳新的頭像", "displayName": "顯示名稱", "enterDisplayName": "輸入顯示名稱", "saveChanges": "儲存變更", "saving": "儲存中...", "accentColor": "強調色", "chooseAccentColor": "選擇按鈕、連結和醒目的主要強調色", "maintenanceMode": "維護模式", "protectedMode": "保護模式", "changePasscode": "更改密碼", "currentPasscode": "目前密碼", "enterCurrentPasscode": "輸入目前密碼", "enterNewPasscode": "輸入新密碼", "confirmNewPasscode": "確認新密碼", "changing": "更改中...", "publicUsername": "公開用戶名", "username": "用戶名", "save": "儲存", "clearUsername": "清除用戶名", "specialUsernames": "特殊用戶名", "add": "新增", "logout": "登出",
  },
  "ja": {
    // Header
    "moments": "瞳映",
    "searchPosts": "ポストを検索...",
    "filteringBy": "フィルター：",
    
    // Post interactions
    "like": "ナイス！",
    "comment": "コメント",
    "reply": "返信",
    "writeComment": "コメントを書く...",
    "writeReply": "返信を書く...",
    "replyTo": "返信先",
    "replyingTo": "返信先",
    
    // Username dialog
    "welcome": "ようこそ！",
    "enterNameToInteract": "ポストに反応するにはユーザーネームを入力してください",
    "usernameTip": "パスワード不要！でも、ユーザーネームは後から変更できませんので、慎重にお選びください。",
    "yourName": "ユーザーネーム",
    "enterYourName": "ユーザーネームを入力",
    "cancel": "キャンセル",
    "continue": "続ける",
    "checking": "確認中...",
    "verifyingName": "ユーザーネームを確認しています",
    "nameAlreadyUsed": "このユーザーネームは使用済みです",
    "nameUsedBefore": "は既に使用されています。",
    "nameUnavailable": "使用できない名前",
    "nameUnavailableDescription": "は使用できません。",
    "nameUnavailableSuggestion": "別のユーザーネームをお選びください。",
    "nameUsedDescription": "これがあなたのユーザーネームであれば、このまま無視してお進みいただけます。そうでなければ、混乱を避けるため別のユーザーネームをお選びいただくことをお勧めします。",
    "chooseDifferentName": "別のユーザーネームを選ぶ",
    "continueAnyway": "このまま続ける",
    
    // Feed
    "connectionError": "接続エラー",
    "checkInternet": "インターネット接続を確認してください",
    "tryAgain": "再試行",
    "noResultsFound": "結果が見つかりません",
    "noPostsMatching": "一致するポストがありません",
    "noPostsWith": "該当するポストがありません",
    "clearFilter": "フィルターを解除",
    "noMomentsYet": "モーメントはまだありません",
    "checkBackSoon": "また後で確認してください",
    "loadingMore": "読み込み中...",
    "reachedEnd": "すべて読み込みました",
    
    // Likes
    "alreadyLiked": "既にナイスしています",
    
    // Time
    "justNow": "たった今",
    "mAgo": "分前",
    "hAgo": "時間前",
    "dAgo": "日前",
    
    // Language
    "language": "言語",
    
    // Theme
    "settings": "設定",
    "theme": "テーマ",
    "light": "ライト",
    "dark": "ダーク",
    "system": "システム設定に従う",
    
    // Maintenance
    "underMaintenance": "メンテナンス中",
    "maintenanceMessage": "後でまたお越しください！",

    // Photo viewer
    "resetZoom": "ズームをリセット",

    // Admin
    "adminLogin": "管理者ログイン", "setUpAdminAccess": "管理者アクセスを設定", "createPasscodeSecure": "管理パネルを保護するパスコードを作成", "enterPasscodeAccess": "管理パネルにアクセスするにはパスコードを入力", "newPasscode": "新しいパスコード", "passcode": "パスコード", "confirmPasscode": "パスコードを確認", "enterPasscode": "パスコードを入力", "confirmPasscodePlaceholder": "パスコードを確認", "settingUp": "設定中...", "loggingIn": "ログイン中...", "createPasscode": "パスコードを作成", "login": "ログイン", "posts": "投稿", "create": "作成", "profile": "プロフィール", "security": "セキュリティ", "managePosts": "投稿を管理", "noPostsYetAdmin": "投稿はまだありません。最初の投稿を作成しましょう！", "allPostsLoaded": "すべての投稿を読み込みました", "deletePost": "投稿を削除", "deletePostConfirm": "この投稿を削除しますか？この操作は取り消せません。", "delete": "削除", "deleting": "削除中...", "profileSettings": "プロフィール設定", "customizeProfile": "プロフィール画像、バナー、表示名をカスタマイズ", "bannerImage": "バナー画像", "profilePicture": "プロフィール画像", "uploadProfilePicture": "クリックして新しいプロフィール画像をアップロード", "displayName": "表示名", "enterDisplayName": "表示名を入力", "saveChanges": "変更を保存", "saving": "保存中...", "accentColor": "アクセントカラー", "chooseAccentColor": "ボタン、リンク、ハイライトのアクセントカラーを選択", "maintenanceMode": "メンテナンスモード", "protectedMode": "保護モード", "changePasscode": "パスコードを変更", "currentPasscode": "現在のパスコード", "enterCurrentPasscode": "現在のパスコードを入力", "enterNewPasscode": "新しいパスコードを入力", "confirmNewPasscode": "新しいパスコードを確認", "changing": "変更中...", "publicUsername": "公開ユーザー名", "username": "ユーザー名", "save": "保存", "clearUsername": "ユーザー名をクリア", "specialUsernames": "特別なユーザー名", "add": "追加", "logout": "ログアウト",
  },
} as const

export type TranslationKey = keyof typeof translations.en

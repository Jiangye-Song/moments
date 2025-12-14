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
    "moments": "Moments",
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
  },
  "zh-CN": {
    // Header
    "moments": "瞬间",
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
  },
  "zh-TW": {
    // Header
    "moments": "瞬間",
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
  },
  "ja": {
    // Header
    "moments": "モーメント",
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
  },
} as const

export type TranslationKey = keyof typeof translations.en

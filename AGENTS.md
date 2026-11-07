# FirstLght 发布规则

每次向用户交付可安装的新版本时：

- 更新根目录 `app-release.json`，递增版本号与构建号，并在 `releases` 最前新增一条中文更新记录，逐项写明实际完成的修复。不可覆盖、删除或虚构历史发布版本。
- 同步 `package.json`、`package-lock.json`、`ios-src/Info.plist`、`project.yml` 的版本。运行 `npm run check:release` 验证一致性。
- 「我」页面的版本卡和更新历史由 `app-release.json` 生成。构建标识由打包时的提交 SHA 注入；不要手写过期提交号。
- 交付前运行 `npm test`，验证生成 IPA 的原生版本与应用内版本一致，并提供带版本号的下载文件名。

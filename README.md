csproj-synchronizer
--------
## Goal
1. check csproj file's content, make sure all `<Content Include="sompath/foo/bar.js"></Content>` file is exist in project. if not exit with code 1.
2. check all file is added into csproj file as index. if not throw error with exit code 1.
3. [todo] Automaticly fix issues and overwrite back to csproj file.

## Usage
1. `npm i -g csproj-synchronizer`
2. run on your project root `csproj-sync --file="path/to/your/Some.csproj" --configFile="./some/json/config/file.json"`

### example config file
```
{
  "checkPath": [
     "./Source/Web/Scripts/**/*.js",
     "./Source/Web/Content/**/*.scss",
     "./Source/Web/Images/**/*.{png,jpg,svg}"
  ],
  "ignorePath": [
    "./Source/Web/Scripts/Dest/**",
  ]
}
```

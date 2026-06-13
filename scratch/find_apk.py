import pathlib

workspace = pathlib.Path(r'd:\TT_BaiTarot')
apks = list(workspace.glob('**/*.apk'))

if apks:
    print("Found APKs:")
    for apk in apks:
        print(f"- {apk.absolute()}")
else:
    print("No APKs found.")

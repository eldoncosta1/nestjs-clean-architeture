# Fix Prisma Windows - Solução para Erros EPERM

```powershell
taskkill /f /im node.exe
Remove-Item "node_modules" -Recurse -Force
pnpm install --force  
npx prisma generate
```


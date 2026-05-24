# Ritim Mac — Desktop App

Ritim ([task.ertugrulaslan.com](https://task.ertugrulaslan.com)) için native macOS desktop client.

## Özellikler

- **Menu bar** sürekli erişim — üst bardaki ikondan tek tıkla aç/kapa
- **Native bildirimler** — macOS Notification Center'da hatırlatma
- **Görev CRUD** — Mac'ten yeni görev oluştur, mevcut görevleri yönet
- **Hatırlatmalara aksiyon** — Yapıldı / 15dk / 1sa / 3sa / Atla butonları
- **Global kısayol** — ⌘⇧T ile hızlı görev ekleme penceresi
- **Menu bar badge** — bekleyen görev sayısı menü barında

## Stack

- Tauri 2 (Rust)
- React 19 + TypeScript + Vite 7
- Tailwind 4
- Bundle: ~16MB, RAM: ~50MB

## Kurulum

1. `Ritim.app` dosyasını `/Applications` klasörüne sürükle
2. **Terminal'de bir kez çalıştır** (Finder sürükleme ad-hoc imzayı bozar):
   ```bash
   xattr -cr /Applications/Ritim.app && \
     codesign --force --deep --sign - /Applications/Ritim.app
   ```
3. İlk açılışta: sağ tık → "Open" (imzalanmamış uygulama uyarısını geç)
4. Login ekranında email + şifre gir (web panelden hesap oluşturmuş olmalısın)
5. İlk bildirim için macOS izin verecek
6. Menu bar'da görünen Ritim ikonuna tıkla → pencere aç/kapa

## Geliştirme

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build              # .app + .dmg
npm run tauri build -- --bundles app  # sadece .app
```

Çıktı: `src-tauri/target/release/bundle/macos/Ritim.app`

## Mimari

- **Frontend** (`src/`): Login, Dashboard, New Task, Settings, Quick Add
- **State** (`src/store.ts`): Zustand + Tauri Store plugin
- **API client** (`src/api.ts`): Bearer token ile `task.ertugrulaslan.com`'a fetch
- **Background poller** (`src/poller.ts`): Her 60s instance listele, native notification fırlat, tray badge güncelle
- **Rust backend** (`src-tauri/src/lib.rs`): Tray, global shortcut, window management

## Sınırlamalar (v0.1)

- Native notification action buttons (Yapıldı/Ertele bildirim üzerinden) henüz Tauri'de stabil değil — pencereyi açıp basmak gerekiyor
- DMG bundling sorun yaşayabilir — .app yeterli
- Code signing yok — Apple Developer hesabı sonra eklenir

## Sonraki sürüm

- [ ] Notification action buttons
- [ ] WebSocket ile real-time update
- [ ] Auto-update (Tauri updater)

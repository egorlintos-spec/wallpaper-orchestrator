# pins/ — drop your images here

Put finished images into category subfolders. The **Build Pinterest CSV**
GitHub Action turns them into a Pinterest bulk-upload `pinterest_upload.csv`.

```
pins/
├── Ads/        # ads, product, branding
├── Magazine/   # editorial, fashion, covers
├── Posters/    # posters, film posters, travel
├── Art/        # art, botanical, surreal
└── Other/      # everything else
```

## How it works
1. Commit images (`.png/.jpg/.jpeg/.webp`) into a category folder.
2. The Action runs (auto on push to `pins/**`, or manually via **Actions → Build Pinterest CSV → Run workflow**).
3. Download the **pinterest_upload_csv** artifact → it contains `pinterest_upload.csv`.
4. In Pinterest: **Create → Bulk create Pins → upload the CSV**.

## Per-image captions (optional)
Put a `name.txt` next to `name.png`:
- line 1 = pin **title**
- the rest = extra **description** text

Tags (category + popular) and your Boosty link are added automatically.

## Notes
- `Media URL` in the CSV points to `raw.githubusercontent.com` — so the repo must be **public**.
- Board name in the CSV = the category folder name (create those boards on Pinterest first, or matching names).

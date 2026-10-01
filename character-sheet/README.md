# Character Sheet Builder

An editable character reference sheet (turnaround, face, expressions, poses, costume, palette).
It opens in any browser and is plain HTML/CSS/JS, so you can also edit it in VS Code.

```
character-sheet/
├── index.html      ← the sheet layout and all default text
├── styles.css      ← colors, fonts, sizes (tokens at the top)
├── app.js          ← editing, image swap, save/load, exports
├── assets/         ← the default images (one file per picture)
└── vendor/         ← html2canvas + JSZip (bundled, so it works offline)
```

## Use it in the browser

- **Edit text:** click any heading, label, profile value, or caption and type.
- **Swap an image:** hover over it.
  - 🗑 **trash** deletes it, leaving a **+ Add image** box. Click it to pick a file from your computer.
  - ⤴ **upload** replaces it straight away.
  - ⤢ **fit** switches between *fill* (crop to the frame) and *fit* (show the whole image).
  - You can also drag an image file onto any frame.
- **Palette swatches** (under the profile) are color pickers.
- Your edits save automatically in this browser. To move them to another computer, use
  **File ▸ Save project (.json)** and **Open project (.json)**. Uploaded images are stored inside that file.

## Use it as a template

The sheet comes filled in with a sample character so you can see what goes where.

- **File ▸ New blank character** clears every image, description and swatch. It keeps the layout, section titles,
  captions and profile labels, so you only fill in the blanks (each image box shows **+ Add image**).
- **Profile rows:** use **+ Add profile row** to add fields such as *Name*, *Age* or *Species*. Hover over a row and
  click ✕ to remove it. Empty rows are left out of the AI prompt.
- **Rename anything:** section titles and captions are editable too. Rename *Expression sheet* or *Hands clasped*
  to whatever fits your character.
- Save each character as its own project file (**File ▸ Save project**). You can reopen it later or start the next one from blank.
- **File ▸ Reset to sample character** brings back the original example.

## Export

| Button | You get | Use it for |
|---|---|---|
| File ▸ **PDF** | The print dialog, sized to the sheet. Pick **Save as PDF** and turn on *Background graphics*. | Sharing or printing |
| File ▸ **PNG** | One high-resolution image of the whole sheet | A single reference image |
| **AI prompt / Seedance pack** | An editable prompt, plus `prompt.md`, `character.json`, and a **.zip** | Seedance and other video/image models |

The AI pack `.zip` contains:

- `prompt.md`: a character-consistency video prompt, the profile, the palette, and a list of every image
- `character.json`: the same data in structured form (good for LLMs and scripts)
- `images/NN-<slot>-<caption>.jpg`: every picture as its own file
- `sheet.png`: the full sheet

For Seedance, upload the face and turnaround images (or `sheet.png`) as reference images. Then paste the
**Video prompt** paragraph from `prompt.md` and add your shot or action description.

## Edit it in VS Code

- **Change a default image:** replace the file in `assets/` with the same name, or change the `src` in `index.html`.
- **Change default text:** edit it in `index.html`. Profile rows are the `<dt>`/`<dd>` pairs. Every other editable element has a `data-k="..."` key, and each key must be unique.
- **Add an image slot:** copy a `<figure class="slot" data-id="...">` block and give it a new `data-id` and `data-k`.
- After you edit `index.html`, the page loads the new template, not your old browser edits.
  The old edits are kept in a backup in browser storage.

> **PNG / ZIP export needs a local server.** Browsers stop pages opened as `file://` from reading their own image
> files. In VS Code, install the **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.
> Or run `python -m http.server` in this folder and open http://localhost:8000. Editing, uploading, saving, and PDF
> all work without a server.

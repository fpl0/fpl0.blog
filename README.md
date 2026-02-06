# fpl0.blog

My personal blog.

## Writer's Style Guide

All content is managed in `src/content/blog/` using Markdown or MDX.

### Headings

```markdown
## Major Section (H2)
### Subsection (H3)
```

### Body Text

Standard paragraph text. Use bold for emphasis, italic for voice, and code for technical terms.

```markdown
This is a paragraph with **bold text**, *italic text*, and `inline code`.
```

### Blockquotes

```markdown
> "A quote with proper attribution."
>
> <cite>Author Name</cite>
```

### Code Blocks

````markdown
```python
def example():
    return 42
```
````
Code blocks support line numbers, copy buttons, and hover highlighting.

### Figures and Captions

```markdown
![Description](./image.png)

**Figure 1:** Caption text here.
```

### Tables

```markdown
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique ID |

**Table 1:** Caption text here.
```

### Task Lists

```markdown
- [x] Completed item
- [ ] Pending item
```

### Footnotes

```markdown
This is a claim[^1].

[^1]: Source of the claim.
```

### Collapsible Sections

```markdown
<details>
<summary>Click to expand</summary>

Hidden content here...

</details>
```

### YouTube Videos

```markdown
<lite-youtube videoid="dQw4w9WgXcQ" title="Video Title"></lite-youtube>
```

## Visual Identity

The design uses a warm, dark palette of walnut and cream to support long-form technical reading. A classical serif handles the headings while a clean sans-serif covers the body text, all balanced on a Minor Third scale for a quiet, archival feel.

## Commands

| Command | Action |
| :--- | :--- |
| `bun install` | Install dependencies |
| `bun run dev` | Start development server |
| `bun run build` | Build for production to ./dist/ |
| `bun run preview` | Preview production build locally |

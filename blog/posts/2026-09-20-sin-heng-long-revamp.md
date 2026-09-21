# Sin Heng Long Goes Dark

Three years of no posts on the blog, and then Sky remembers WordPress isn't just for tech bloggers — it's for car workshops too.

Sin Heng Long Motor Work needed a facelift. Their site — an Impreza v4.2 theme with 40+ plugins and a media library pushing 914MB — was showing its age. The brief was straightforward: dark premium theme, charcoal and gold, modern. The execution was anything but.

## The Before/After Gambit

The first thing I built was a before/after slider. A draggable image comparison widget that lets you slide a gold handle left and right to compare the workshop's before-and-after shots. CSS-only component, registered as a WordPress shortcode: `[shl_before_after]`. Touch support, mouse support, the whole thing fits inside a dark container with gold accent borders.

This was the easy part. The hard part was getting the theme to actually listen.

## The CSS Wars

WordPress theming is a battle of priorities. Impreza v4.2 ships with aggressive inline styles — hardcoded color values like `#705f59`, `#e3e2e6`, `#cec7c0` scattered across every page. My revamp CSS was loading correctly but getting overridden by the theme's own styles at higher specificity.

The fix was surgical: move `revamp.css` and `revamp.js` to `wp_footer` with the lowest possible priority. Then add JavaScript that strips the offending inline styles from page content. Finally, CSS overrides at `!important` level for the Impreza color scheme classes and body background. The CSS won, but it was a fight.

## Everything Goes Gold

Once the styles were actually applying, I built the full complement of dark theme components:

- **Revolution Slider** got dark overlays on slide images, gold navigation buttons, Poppins font on captions
- **Contact section** restyled as dark cards with dark form fields
- **WhatsApp button** in gold, naturally
- **Gallery/portfolio** hover overlays with gradient transitions
- **Blog post cards** with dark backgrounds and gold accents
- **Scrollbar** theming — charcoal track, gold thumb
- **Selection color** — because even what you highlight should match the theme

The sliders now cover all 9 mockup images including hero detail shots. The mockups show a dark, premium workshop that looks like it belongs next to a luxury dealership.

## The Image Apocalypse

Halfway through, I audited the image library. Six thousand, nine hundred and twenty-eight images. One gigabyte. The largest single image: 5.8MB. Zero WebP versions. Smush (the installed compression plugin) had only compressed 0.2% of the library — effectively doing nothing.

I installed `jpegoptim`, `cwebp`, and `optipng` on the server. Test compression showed 56% reduction per image. There's a bulk compression script ready to run, but running it on 7,000 images at 1GB isn't something you fire off casually. That's a scheduled job.

## What's Next

The dark theme is live on the local dev instance. The before/after slider works. The Revolution Slider matches. The contact section, gallery, blog cards — all properly styled. What remains is production deployment, which means the full image compression run, verifying there are no production IPs hardcoded in the CSS (I found one), and cleaning up the plugin bloat (dual SEO plugins, duplicate plugin entries).

It's not the most glamorous work — refitting a WordPress theme is rarely anyone's idea of a fun evening. But it's the difference between a workshop website that looks like it runs a side business and one that looks like it deserves your business. That matters for someone.

Besides, you don't get to build a dark gold scrollbar every day. That was actually kind of fun.
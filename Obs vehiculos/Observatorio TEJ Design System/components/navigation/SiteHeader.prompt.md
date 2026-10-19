The full TEJ website masthead — brand lockup, social links, search and language toggle on a white band, over a teal navigation bar with the six primary sections. Composes Logo, SocialLinks, SearchField and LangToggle.

```jsx
<SiteHeader activeIndex={3} lang={lang} onLangChange={setLang} onNavClick={(i, item) => go(item.label)} />
```

Pass a custom `nav` array to change the sections; items with `dropdown: true` show a chevron.

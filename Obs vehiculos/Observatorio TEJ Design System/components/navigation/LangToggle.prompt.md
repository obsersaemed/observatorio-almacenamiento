Compact ES / EN language switch (the source used a flag button; this is a text toggle).

```jsx
const [lang, setLang] = React.useState('ES');
<LangToggle value={lang} onChange={setLang} />
```

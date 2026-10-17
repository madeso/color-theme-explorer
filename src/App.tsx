import { useState } from 'react'

import { color_themes, dark_themes, light_themes, type NamedTheme } from './themes'
import { evaluate_theme } from './color-benchmark';
import type { Colors } from './theme';
import { contrast, string_to_rgb } from './contrast';

interface Combo
{
  f: string;
  b: string;
  disp: string;
}

type ColorName = keyof Colors;

const combo = (theme: Colors, fore: ColorName, back: ColorName): Combo => 
({
  f: theme[fore],
  b: theme[back],
  disp: `${fore} on ${back}`
});

const color_combos = (theme: Colors): Combo[][] => [
  [
    combo(theme, "f_high", "background"),
    combo(theme, "f_med", "background"),
    combo(theme, "f_low", "background"),
  ],
  [
    combo(theme, "f_high", "b_high"),
    combo(theme, "f_med", "b_high"),
    combo(theme, "f_low", "b_high"),
  ],
  [
    combo(theme, "f_high", "b_med"),
    combo(theme, "f_med", "b_med"),
    combo(theme, "f_low", "b_med"),
],[
    combo(theme, "f_high", "b_low"),
    combo(theme, "f_med", "b_low"),
    combo(theme, "f_low", "b_low"),
  ],[
    combo(theme, "f_inv", "b_inv"),
  ]
];

const lowest_contrast = (t: NamedTheme, what: "best" | "worst") => {
  const items = color_combos(t.theme).flat().map(x => {
        const f = string_to_rgb(x.f);
        const b = string_to_rgb(x.b);
        if(f && b) return {contrast: contrast(f, b), ...x};
        return null;
      });
  const valid = items.filter(x => x !== null);
  const sorted = valid.sort((lhs, rhs)=> lhs.contrast - rhs.contrast);
  return what === "worst" ? sorted[0] : sorted[sorted.length - 1];
}

const classify_ratio = (n: number) => ({
  // The visual presentation of text and images of text has a contrast ratio of at least 4.5:1, except for the following: (Level AA)
  //  Large-scale text and images of large-scale text have a contrast ratio of at least 3:1;
  min: {
    text: n > 4.5,
    large: n > 3,
  },
  // Contrast (Enhanced): The visual presentation of text and images of text has a contrast ratio of at least 7:1, except for the following: (Level AAA)
  // Large Text: Large-scale text and images of large-scale text have a contrast ratio of at least 4.5:1;
  enchanced: {
    text: n > 7,
    large: n > 4.5
  }
});
type RatioClass = ReturnType<typeof classify_ratio>;

const RatioTextFail = () => <b>Text fail</b>;
const RatioLargeFail = () => <b>Large fail</b>;
const RatioOk = () => <>OK</>;
const RatioDesc = ({cl, k}: {cl: RatioClass, k: keyof RatioClass}) => 
  cl[k].large ? ( cl[k].text ? <RatioOk /> : <RatioTextFail/>) : <RatioLargeFail/>;

const ThemeSvg = ({t}: {t: Colors}) => <svg width="96px" height="64px" xmlns="http://www.w3.org/2000/svg" baseProfile="full" version="1.1">
        <rect width='96' height='64' id='background' fill={t.background} />
        <circle cx='24' cy='24' r='8' id='f_high' fill={t.f_high} />
        <circle cx='40' cy='24' r='8' id='f_med' fill={t.f_med} />
        <circle cx='56' cy='24' r='8' id='f_low' fill={t.f_low} />
        <circle cx='72' cy='24' r='8' id='f_inv' fill={t.f_inv} />
        <circle cx='24' cy='40' r='8' id='b_high' fill={t.b_high} />
        <circle cx='40' cy='40' r='8' id='b_med' fill={t.b_med} />
        <circle cx='56' cy='40' r='8' id='b_low' fill={t.b_low} />
        <circle cx='72' cy='40' r='8' id='b_inv' fill={t.b_inv} />
      </svg>

function App() {
  const [theme, setTheme] = useState<NamedTheme | null>(null);

  const map = (name: string, es: NamedTheme[]) => es.map(t => ({class: name, ...t}));

  const all_themes = [
    ...map("light", light_themes),
    ...map("dark", dark_themes),
    ...map("color", color_themes)
  ];
  const header = <tr>
    <th>Icon</th>
    <th>Name</th>
    <th>Class</th>
    <th>Category</th>
    <th>Score</th>
    <th>Contrast</th>
    <th>WCAG Min</th>
    <th>WCAG Ench</th>
    <th>Best Min</th>
    <th>Best Ench</th>
  </tr>;
  const themes_sorted = all_themes.map(t => ({
    ...t, evaluated: evaluate_theme(t.theme), lowest_contrast: lowest_contrast(t, "worst"), best_contrast: lowest_contrast(t, "best")
  })).toSorted((lhs, rhs) => rhs.evaluated.score - lhs.evaluated.score);
  const theme_list = themes_sorted.map(t => <tr>
      <td><ThemeSvg t={t.theme}/></td>
      <td><a onClick={() => {
        setTheme(t);
      }}>{t.name}</a></td>
      <td>{t.class}</td>
      <td>{t.evaluated.cat}</td>
      <td>{t.evaluated.score}</td>
      <td>{t.lowest_contrast.contrast.toLocaleString(undefined, {maximumFractionDigits:2})} ({t.lowest_contrast.disp})</td>
      <td><RatioDesc k="min" cl={classify_ratio(t.lowest_contrast.contrast)}/></td>
      <td><RatioDesc k="enchanced" cl={classify_ratio(t.lowest_contrast.contrast)}/></td>
      <td><RatioDesc k="min" cl={classify_ratio(t.best_contrast.contrast)}/></td>
      <td><RatioDesc k="enchanced" cl={classify_ratio(t.best_contrast.contrast)}/></td>
    </tr>
  );
  
  return (
    <>
      <section id="center">
        <table>
          <thead>
            {header}
          </thead>
          {theme_list}
        </table>
      </section>

      <section>
        {theme && <ThemeDisplay theme={theme} />}
      </section>
    </>
  )
}

const ThemeDisplay = ({theme}: {theme: NamedTheme}) =>
  <div className='window' style={{
    backgroundColor: theme.theme.background
  }}>
    {
      color_combos(theme.theme).map((arr, ind) => <>
        {ind !== 0 && <hr />}
        {arr.map(c => <Display f={c.f} b={c.b}/>)}
      </>)
    }
  </div>;

const Display = (props: {f: string, b: string}) =>
  <div className='display' style={{
    backgroundColor: props.b,
    color: props.f
  }}>Sample text</div>;

export default App

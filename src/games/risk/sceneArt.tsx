import type { ComponentType } from 'react';

/**
 * The office, drawn in code on a 1600 x 900 grid (the same one the risks in scenes.ts use). Flat shapes only, so it
 * stays readable from a couple of metres away; colours are the --scene-* tokens in theme.css (via risk.css).
 * Besides the 8 risks there are harmless things to tap too: the window, clock, poster, plant, mug, chair, and a
 * locked PC (good practice).
 */
function Office() {
  return (
    <g className="scene-art">
      {/* Room */}
      <rect className="sc-wall" width="1600" height="620" />
      <rect className="sc-wall-shade" width="1600" height="36" />
      <rect className="sc-floor" y="620" width="1600" height="280" />
      <path className="sc-floor-line" d="M0 700H1600M0 800H1600" />
      <rect className="sc-skirting" y="604" width="1600" height="16" />

      {/* Window */}
      <rect className="sc-frame" x="50" y="70" width="280" height="350" rx="6" />
      <rect className="sc-sky" x="64" y="84" width="252" height="322" />
      <path className="sc-city" d="M64 406V318h34v-58h40v82h26v-112h46v132h30v-74h40v60h36v58z" />
      <path className="sc-frame" d="M184 84h12v322h-12zM64 238h252v10H64z" />
      <rect className="sc-frame" x="36" y="418" width="308" height="16" rx="4" />

      {/* Whiteboard, with the guest Wi-Fi password written on it (risk) */}
      <rect className="sc-metal" x="388" y="68" width="424" height="276" rx="8" />
      <rect className="sc-paper" x="398" y="78" width="404" height="256" rx="4" />
      <rect className="sc-metal-dark" x="420" y="344" width="360" height="10" rx="3" />
      <rect className="sc-ink-red" x="560" y="336" width="34" height="8" rx="3" />
      <rect className="sc-ink-blue" x="604" y="336" width="34" height="8" rx="3" />
      <text className="sc-ink-blue sc-bold" x="420" y="120" fontSize="30">
        Q4 GOALS
      </text>
      <text className="sc-ink-blue" x="420" y="160" fontSize="22">
        • New website
      </text>
      <text className="sc-ink-blue" x="420" y="192" fontSize="22">
        • Hire 2 devs
      </text>
      <text className="sc-ink-blue" x="420" y="224" fontSize="22">
        • Pass the audit
      </text>
      <path className="sc-marker-blue" d="M424 252v68h150M430 312l36-26 32 12 48-42" />
      <g transform="rotate(-3 704 274)">
        <rect className="sc-marker-red" x="610" y="228" width="186" height="92" rx="10" />
        <text className="sc-ink-red sc-bold" x="622" y="256" fontSize="20">
          GUEST WI-FI
        </text>
        <text className="sc-ink" x="622" y="282" fontSize="16">
          Brightwell-Guest
        </text>
        <text className="sc-ink-red sc-bold" x="622" y="308" fontSize="15.5">
          pw: Welcome2026!
        </text>
      </g>

      {/* Clock */}
      <circle className="sc-frame" cx="880" cy="130" r="50" />
      <circle className="sc-paper" cx="880" cy="130" r="42" />
      <path className="sc-hand" d="M880 94v8M880 158v8M844 130h8M908 130h8" />
      <path className="sc-hand sc-hand--thick" d="M880 130l-18-12M880 130l18-24" />
      <circle className="sc-ink" cx="880" cy="130" r="5" />

      {/* Poster: good advice, not a risk */}
      <rect className="sc-accent" x="950" y="80" width="160" height="220" rx="6" />
      <path className="sc-shackle" d="M1013 142v-12a17 17 0 0 1 34 0v12" />
      <rect className="sc-paper" x="1004" y="140" width="52" height="42" rx="6" />
      <circle className="sc-accent" cx="1030" cy="158" r="5" />
      <text className="sc-ink sc-bold" x="1030" y="222" fontSize="22" textAnchor="middle">
        THINK
      </text>
      <text className="sc-ink sc-bold" x="1030" y="248" fontSize="18" textAnchor="middle">
        BEFORE YOU
      </text>
      <text className="sc-ink sc-bold" x="1030" y="274" fontSize="22" textAnchor="middle">
        CLICK
      </text>

      {/* Server room, its door wedged open (risk) */}
      <rect className="sc-paper sc-sign" x="1268" y="112" width="164" height="40" rx="4" />
      <text className="sc-ink-red sc-bold" x="1350" y="140" fontSize="21" textAnchor="middle">
        SERVER ROOM
      </text>
      <rect className="sc-metal-dark" x="1238" y="158" width="224" height="462" />
      <rect className="sc-screen" x="1252" y="172" width="196" height="448" />
      <rect className="sc-rack" x="1290" y="250" width="70" height="370" />
      <rect className="sc-rack" x="1368" y="250" width="70" height="370" />
      <path
        className="sc-rack-line"
        d="M1294 290h62M1294 330h62M1294 370h62M1294 410h62M1294 450h62M1294 490h62M1294 530h62M1294 570h62M1372 290h62M1372 330h62M1372 370h62M1372 410h62M1372 450h62M1372 490h62M1372 530h62M1372 570h62"
      />
      {[270, 310, 350, 390, 430, 470, 510, 550, 590].map((y) => (
        <g key={y}>
          <circle className="sc-led" cx="1304" cy={y} r="4" />
          <circle className="sc-led" cx="1382" cy={y} r="4" />
          <circle className="sc-led sc-led--dim" cx="1318" cy={y} r="4" />
        </g>
      ))}
      <path className="sc-wood" d="M1252 172L1330 210V592L1252 620Z" />
      <rect className="sc-metal-dark" x="1316" y="392" width="7" height="34" rx="3" />
      <path className="sc-wedge" d="M1304 622H1370V600Z" />
      <rect className="sc-paper sc-sign" x="1478" y="250" width="104" height="62" rx="4" />
      <text className="sc-ink-red sc-bold" x="1530" y="276" fontSize="15" textAnchor="middle">
        KEEP DOOR
      </text>
      <text className="sc-ink-red sc-bold" x="1530" y="298" fontSize="15" textAnchor="middle">
        SHUT
      </text>

      {/* Desk A, with a locked PC (fine) and its password on a sticky note (risk) */}
      <ellipse className="sc-shadow" cx="326" cy="870" rx="290" ry="10" />
      <rect className="sc-metal" x="64" y="626" width="16" height="240" />
      <rect className="sc-metal" x="572" y="626" width="16" height="240" />
      <rect className="sc-wood-dark" x="92" y="626" width="140" height="232" rx="4" />
      <path className="sc-drawer-line" d="M92 704h140M92 782h140" />
      <rect className="sc-metal" x="146" y="660" width="32" height="8" rx="4" />
      <rect className="sc-metal" x="146" y="738" width="32" height="8" rx="4" />
      <rect className="sc-metal" x="146" y="816" width="32" height="8" rx="4" />
      <ellipse className="sc-green-dark" cx="98" cy="500" rx="15" ry="46" transform="rotate(-28 98 500)" />
      <ellipse className="sc-green" cx="120" cy="486" rx="15" ry="52" />
      <ellipse className="sc-green-dark" cx="142" cy="500" rx="15" ry="46" transform="rotate(28 142 500)" />
      <ellipse className="sc-green" cx="108" cy="516" rx="12" ry="34" transform="rotate(-52 108 516)" />
      <ellipse className="sc-green" cx="134" cy="516" rx="12" ry="34" transform="rotate(52 134 516)" />
      <path className="sc-pot" d="M82 592L92 540H148L158 592Z" />
      <rect className="sc-metal-dark" x="280" y="582" width="60" height="10" rx="3" />
      <rect className="sc-metal-dark" x="302" y="552" width="16" height="32" />
      <rect className="sc-screen" x="170" y="380" width="280" height="176" rx="10" />
      <rect className="sc-lock" x="182" y="392" width="256" height="152" rx="4" />
      <path className="sc-shackle sc-shackle--thin" d="M298 452v-10a12 12 0 0 1 24 0v10" />
      <rect className="sc-paper" x="290" y="450" width="40" height="34" rx="6" />
      <text className="sc-on-screen sc-bold" x="310" y="518" fontSize="20" textAnchor="middle">
        Locked
      </text>
      <rect className="sc-plastic sc-outline" x="222" y="580" width="170" height="12" rx="3" />
      <rect className="sc-mug" x="505" y="552" width="36" height="40" rx="6" />
      <path className="sc-mug-handle" d="M541 562h8a10 10 0 0 1 0 20h-8" />
      <g transform="rotate(6 441 545)">
        <rect className="sc-sticky" x="396" y="500" width="90" height="90" rx="3" />
        <rect className="sc-sticky-band" x="396" y="500" width="90" height="14" rx="3" />
        <text className="sc-ink" x="406" y="540" fontSize="17">
          pw:
        </text>
        <text className="sc-ink sc-bold" x="405" y="568" fontSize="15">
          Tiger#77
        </text>
      </g>
      <rect className="sc-wood" x="40" y="592" width="572" height="34" rx="6" />

      {/* Recycling bin with confidential papers in it (risk) */}
      <ellipse className="sc-shadow" cx="666" cy="878" rx="56" ry="8" />
      <g transform="rotate(-14 650 712)">
        <rect className="sc-paper sc-outline" x="612" y="672" width="72" height="84" />
        <path className="sc-paper-line" d="M622 690h52M622 704h52M622 718h40" />
      </g>
      <g transform="rotate(9 694 706)">
        <rect className="sc-paper sc-outline" x="650" y="662" width="88" height="88" />
        <rect className="sc-stamp" x="656" y="682" width="76" height="20" rx="2" />
        <text className="sc-ink-red sc-bold" x="694" y="696" fontSize="10" textAnchor="middle">
          CONFIDENTIAL
        </text>
        <path className="sc-paper-line" d="M662 716h64M662 730h48" />
      </g>
      <path className="sc-bin" d="M624 728H708L700 878H632Z" />
      <rect className="sc-bin-dark" x="618" y="720" width="96" height="14" rx="4" />
      <text className="sc-on-bin sc-bold" x="666" y="812" fontSize="15" textAnchor="middle">
        RECYCLE
      </text>

      {/* Desk B: an unlocked PC showing someone's inbox (risk), and an ID badge left behind (risk) */}
      <ellipse className="sc-shadow" cx="975" cy="870" rx="250" ry="10" />
      <rect className="sc-metal" x="742" y="626" width="16" height="240" />
      <rect className="sc-metal" x="1196" y="626" width="16" height="240" />
      <rect className="sc-metal-dark" x="940" y="582" width="60" height="10" rx="3" />
      <rect className="sc-metal-dark" x="962" y="552" width="16" height="32" />
      <rect className="sc-screen" x="830" y="376" width="280" height="180" rx="10" />
      <rect className="sc-app" x="842" y="388" width="256" height="156" rx="4" />
      <rect className="sc-ink-blue" x="842" y="388" width="256" height="22" rx="4" />
      <text className="sc-on-screen sc-bold" x="852" y="404" fontSize="13">
        Inbox (3)
      </text>
      <rect className="sc-wall-shade" x="842" y="410" width="56" height="134" />
      <rect className="sc-app-selected" x="898" y="444" width="200" height="30" />
      {[422, 452, 482, 512].map((y, i) => (
        <g key={y}>
          <circle className={i === 2 ? 'sc-accent' : 'sc-ink-blue'} cx="914" cy={y + 4} r="7" />
          <rect className="sc-ink" x="928" y={y - 2} width={i % 2 ? 110 : 140} height="6" rx="3" />
          <rect className="sc-paper-fill" x="928" y={y + 8} width={i % 2 ? 150 : 120} height="5" rx="2.5" />
        </g>
      ))}
      <rect className="sc-app-line" x="850" y="420" width="40" height="6" rx="3" />
      <rect className="sc-app-line" x="850" y="434" width="32" height="6" rx="3" />
      <rect className="sc-app-line" x="850" y="448" width="36" height="6" rx="3" />
      <rect className="sc-plastic sc-outline" x="890" y="580" width="160" height="12" rx="3" />
      <ellipse className="sc-plastic sc-outline" cx="1078" cy="585" rx="13" ry="8" />
      <path className="sc-lanyard" d="M1112 588C1086 588 1080 552 1104 548C1122 546 1128 560 1126 566" />
      <g transform="rotate(-6 1140 578)">
        <rect className="sc-paper sc-outline-dark" x="1114" y="560" width="54" height="34" rx="4" />
        <rect className="sc-badge" x="1114" y="560" width="54" height="10" rx="3" />
        <rect className="sc-metal" x="1119" y="574" width="14" height="16" rx="2" />
        <rect className="sc-paper-fill" x="1138" y="576" width="24" height="4" rx="2" />
        <rect className="sc-paper-fill" x="1138" y="584" width="17" height="4" rx="2" />
      </g>
      <rect className="sc-wood" x="720" y="592" width="510" height="34" rx="6" />

      {/* The empty chair, pushed back */}
      <ellipse className="sc-shadow" cx="1073" cy="862" rx="80" ry="9" />
      <path className="sc-chair-base" d="M1073 812L1010 842M1073 812L1136 842M1073 812V850" />
      <circle className="sc-chair-dark" cx="1010" cy="848" r="9" />
      <circle className="sc-chair-dark" cx="1136" cy="848" r="9" />
      <circle className="sc-chair-dark" cx="1073" cy="856" r="9" />
      <rect className="sc-metal-dark" x="1066" y="744" width="14" height="70" />
      <rect className="sc-chair" x="1018" y="612" width="110" height="104" rx="18" />
      <rect className="sc-chair-dark" x="1000" y="714" width="146" height="32" rx="12" />

      {/* A USB stick someone found on the floor (risk) */}
      <ellipse className="sc-shadow" cx="918" cy="832" rx="40" ry="6" />
      <g transform="rotate(-12 915 812)">
        <circle className="sc-usb-ring" cx="880" cy="812" r="7" />
        <rect className="sc-usb" x="886" y="802" width="52" height="20" rx="5" />
        <rect className="sc-metal" x="938" y="806" width="16" height="12" rx="1" />
        <rect className="sc-paper" x="893" y="807" width="30" height="10" rx="2" />
      </g>

      {/* Printer on a cabinet, with payslips left in the tray (risk) */}
      <ellipse className="sc-shadow" cx="1518" cy="878" rx="84" ry="8" />
      <rect className="sc-wood-dark" x="1440" y="734" width="156" height="140" rx="4" />
      <path className="sc-drawer-line" d="M1518 740v128" />
      <rect className="sc-metal" x="1500" y="790" width="8" height="30" rx="4" />
      <rect className="sc-metal" x="1528" y="790" width="8" height="30" rx="4" />
      <g transform="rotate(4 1522 630)">
        <rect className="sc-paper sc-outline" x="1488" y="598" width="70" height="60" />
      </g>
      <g transform="rotate(-6 1514 630)">
        <rect className="sc-paper sc-outline" x="1478" y="600" width="74" height="62" />
        <text className="sc-ink-red sc-bold" x="1515" y="624" fontSize="13" textAnchor="middle">
          PAYSLIP
        </text>
        <path className="sc-paper-line" d="M1488 638h54M1488 650h40" />
      </g>
      <rect className="sc-metal" x="1460" y="646" width="116" height="18" rx="6" />
      <rect className="sc-plastic sc-outline" x="1452" y="660" width="132" height="74" rx="10" />
      <rect className="sc-screen" x="1474" y="686" width="88" height="8" rx="3" />
      <rect className="sc-screen" x="1540" y="708" width="34" height="16" rx="3" />
      <circle className="sc-led" cx="1466" cy="716" r="4" />
    </g>
  );
}

/** Each scene's art, by scene id. */
export const SCENE_ART: Record<string, ComponentType> = {
  office: Office,
};

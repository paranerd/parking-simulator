#!/usr/bin/env python3
"""Balancing-Rechner fuer den Parkhaus-Idler.

Rechnet das Modell aus src/game/economy.ts unabhaengig nach. Die
Doppelimplementierung ist Absicht: laufen Python und TypeScript
auseinander, ist einer von beiden falsch und das faellt auf.
Bei Aenderungen am Modell beide anpassen.
"""
import math

# --- Spiegel von src/game/config.ts -----------------------------------------
STUFEN = [
    # name, max, qual, fix
    ("Schotterplatz", 8, -0.5, 0),
    ("Parkplatz", 48, 0.10, 1),
    ("Parkdeck", 96, 0.35, 1),
    ("Parkhaus", 288, 0.60, 1),
    ("Tiefgarage", 384, 0.85, 1),
    ("Regalsystem", 730, 1.10, 1),
]
# faktor, laufend
REICHWEITE = [(1.0, 0), (1.6, 0.15), (2.6, 0.35), (4.2, 0.7), (6.8, 1.3),
              (11, 2.4), (17.5, 4.0), (28, 6.5), (45, 11), (72, 18)]
# proMA, zahlquote
AUTO = [(float("inf"), 0.55), (25, 0.85), (40, 0.90),
        (70, 0.97), (130, 1.00), (250, 1.00)]
# nachfrage, wtp
STAEDTE = [(1.0, 1.0), (2.5, 1.3), (6.0, 1.7), (15.0, 2.2)]

CFG = dict(latent=30, wtpBasis=2.0, streuung=0.8, sek=0.1, proEbene=48,
           pacht=0.55, wartung=0.055, lohn=1.35, etagenMalus=1.15)


def kennzahlen(stufe, plaetze, auto, ez, preis, ruf, stadt=0, pp=0):
    _, _, qual_basis, fixf = STUFEN[stufe]
    nachfrage_f, wtp_f = STAEDTE[stadt]

    median = CFG["wtpBasis"] * wtp_f * (1 + qual_basis)
    akzeptanz = 1 / (1 + math.exp((preis - median) / CFG["streuung"]))

    latent = CFG["latent"] * REICHWEITE[ez][0] * nachfrage_f * ruf
    nachfrage = latent * akzeptanz
    belegt = min(nachfrage, plaetze)

    umsatz = belegt * preis * CFG["sek"] * (1 + 0.02 * pp) * AUTO[auto][1]

    ebenen = max(1, math.ceil(plaetze / CFG["proEbene"]))
    wartung = sum(
        min(CFG["proEbene"], plaetze - k * CFG["proEbene"])
        * CFG["wartung"] * CFG["etagenMalus"] ** k
        for k in range(ebenen)
    )
    personal = plaetze / AUTO[auto][0]
    fix = (ebenen * CFG["pacht"] + wartung + personal * CFG["lohn"]
           + REICHWEITE[ez][1]) * fixf

    return dict(umsatz=umsatz, fix=fix, netto=umsatz - fix,
                auslastung=belegt / plaetze if plaetze else 0,
                abgewiesen=max(0, nachfrage - plaetze),
                leerstand=max(0, plaetze - nachfrage), median=median)


def optimum(stufe, plaetze, auto, ez, ruf, **kw):
    best, best_p = None, 0.1
    for i in range(1, 240):
        p = i * 0.05
        k = kennzahlen(stufe, plaetze, auto, ez, p, ruf, **kw)
        if best is None or k["netto"] > best["netto"]:
            best, best_p = k, p
    return best, best_p


SZENARIEN = [
    ("Stufe 0,   3 Pl, Blechdose,   EZ0", 0, 3, 0, 0, 0.75),
    ("Stufe 0,   8 Pl, Blechdose,   EZ0", 0, 8, 0, 0, 0.85),
    ("Stufe 1,   8 Pl, Kassierer,   EZ1", 1, 8, 1, 1, 0.85),
    ("Stufe 1,  48 Pl, Kassierer,   EZ3", 1, 48, 1, 3, 0.90),
    ("Stufe 2,  96 Pl, Automat,     EZ4", 2, 96, 2, 4, 0.90),
    ("Stufe 3, 288 Pl, Schranke,    EZ7", 3, 288, 3, 7, 0.90),
    ("Stufe 4, 384 Pl, Kennzeichen, EZ8", 4, 384, 4, 8, 0.90),
    ("Stufe 5, 730 Pl, App,         EZ9", 5, 730, 5, 9, 0.90),
]

if __name__ == "__main__":
    print(f"{'Situation':<36}{'Preis':>7}{'Netto':>10}{'Ausl':>7}{'Fix%':>7}")
    print("-" * 67)
    for label, st, pl, au, ez, ruf in SZENARIEN:
        k, p = optimum(st, pl, au, ez, ruf)
        fixq = k["fix"] / k["umsatz"] * 100 if k["umsatz"] else 0
        print(f"{label:<36}{p:>7.2f}{k['netto']:>+10.2f}"
              f"{k['auslastung']*100:>6.0f}%{fixq:>6.0f}%")

    print("\nBekannter Balance-Punkt: Reichweite ist die staerkere Achse")
    k, _ = optimum(3, 288, 3, 4, 0.9)
    print(f"  Stufe 3 unterinvestiert (EZ4):  {k['netto']:+7.2f} /s"
          f"  {k['leerstand']:.0f} Plaetze leer")
    k, _ = optimum(1, 48, 1, 3, 0.9)
    print(f"  Stufe 1 passend        (EZ3):  {k['netto']:+7.2f} /s")
    k, _ = optimum(1, 48, 1, 7, 0.9)
    print(f"  Stufe 1 ueberinvestiert(EZ7):  {k['netto']:+7.2f} /s")

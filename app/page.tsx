"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Car,
  Search,
  AlertTriangle,
  CheckCircle,
  Wrench,
  Activity,
  Filter,
  Download,
  Bell,
  RefreshCw,
  Sparkles,
  Globe,
  Clock,
  Star,
  User,
  Eye,
  Trash2,
  LogOut,
} from "lucide-react"
import { RegistrationForm } from "@/components/registration-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { logout, isAdminSession } from "@/lib/auth" // Importar logout e isAdminSession

type VehicleStatus = "disponivel" | "em_uso" | "manutencao" | "inativa"
type Guarnicao = "MILITAR" | "PRF" | "CIVIL" | "COE" | "CMD_G" | "S_CMD_G" | "CGP" | "AUX" | "SEM_COR"

interface Vehicle {
  id: number
  badge: string
  status: VehicleStatus
  guarnicao: Guarnicao
  model?: string
  lastUpdate: Date
  location?: string
  officer?: string // Nome do oficial
  officerCargo?: string // Cargo do oficial
  officerId?: string // ID do oficial
  mileage?: number
  priority?: "alta" | "media" | "baixa"
}

// New interface for registration log entries
interface RegistrationLogEntry {
  officerName: string
  officerId?: string
  officerCargo?: string // Adicionado cargo ao log
  badge: string
  unit: Guarnicao
  timestamp: Date
}

const statusConfig = {
  disponivel: {
    label: "Disponível",
    icon: CheckCircle,
  },
  em_uso: {
    label: "Em Uso",
    icon: Car,
  },
  manutencao: {
    label: "Manutenção",
    icon: Wrench,
  },
  inativa: {
    label: "Inativa",
    icon: AlertTriangle,
  },
}

const guarnicaoConfig = {
  MILITAR: {
    label: "Militar",
    color: "from-blue-600 via-blue-700 to-blue-800",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  PRF: {
    label: "PRF",
    color: "from-yellow-500 via-orange-500 to-orange-600",
    badgeColor: "bg-orange-100 text-orange-800 border-orange-200",
  },
  CIVIL: {
    label: "Civil",
    color: "from-red-700 via-red-800 to-red-900",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
  },
  COE: {
    label: "C.O.E",
    color: "from-gray-800 via-gray-900 to-black",
    badgeColor: "bg-gray-100 text-gray-900 border-gray-300",
  },
  CMD_G: {
    label: "CMD-Geral",
    color: "from-indigo-600 via-indigo-700 to-indigo-800",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  S_CMD_G: {
    label: "S.CMD-Geral",
    color: "from-purple-600 via-purple-700 to-purple-800",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  CGP: {
    label: "CGP",
    color: "from-teal-600 via-teal-700 to-teal-800",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
  },
  AUX: {
    label: "Auxiliar",
    color: "from-slate-400 via-slate-500 to-slate-600",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
  },
  SEM_COR: {
    label: "Sem Cor",
    color: "from-gray-200 via-gray-300 to-gray-400",
    badgeColor: "bg-gray-100 text-gray-600 border-gray-200",
  },
}

// Mapeamento de keywords para o tipo Guarnicao
const guarnicaoKeywords = {
  "CMD-G": "CMD_G",
  "S.CMD-G": "S_CMD_G",
  PRF: "PRF",
  Civil: "CIVIL",
  COE: "COE",
  CGP: "CGP",
  Militar: "MILITAR",
  AUXGT: "AUX", // Mapeando AUXGT para AUX para simplificar
  AUX: "AUX",
} as const

// Lista de padrões de cargos para parsing, ordenada do mais longo para o mais curto
const cargoPatterns = [
  "DIRETORA PRF",
  "VICE DIR PRF",
  "COORD-PRF",
  "SUP PRF",
  "CMD-BATEDORES-PRF",
  "CMD NOE",
  "CMD DOA",
  "CMD SPEED PRF",
  "CMD-Geral",
  "S.CMD-Geral",
  "COORD MILITAR",
  "COMANDO MILITAR",
  "CMD-SPEED",
  "CMD-SPEED-M",
  "CMD-GAEP",
  "COMANDO GTM",
  "COORD-GOT",
  "CMD-CIVIL",
  "CMD-SAER-C",
  "COORD-CORE",
  "COMANDO DIP",
  "CMD-CORE",
  "COORD-CIVIL",
  "CMD-COE",
  "COORD-COE",
  "CMD-CGP",
  "AUX",
].sort((a, b) => b.length - a.length)

// Dados brutos dos oficiais fornecidos pelo usuário (COMPLETO)
const rawOfficersData = `
Badges de Comandos
BadgeUnidadeNomeCargoID
1 CMD-G Júlia CMD-Geral 1358
2 S.CMD-G Clark S.CMD-Geral 20319
3 PRF Athena DIRETORA PRF 142
4 Civil Nina CMD-CIVIL 5103
5 Civil Angeline CMD-SAER-C 18997
6 Civil Kitsune COORD-CORE 15302
7 Civil Katkat CMD-CIVIL 971
8 PRF Nabrisa VICE DIR PRF 399
9 PRF Celine White COORD-PRF
10 Militar Agatha COORD MILITAR 19822
11 Civil Hungria COORD-CIVIL 16813
12 Civil Israel COMANDO DIP 20246
13 Civil Ravena CMD-CORE 1077
14 COE Yang CMD-COE 1486
15 Civil Brisa COORD-CIVIL 16837
16 Militar Nylli COMANDO MILITAR 30183
17 CGP Duda CMD-CGP 7350
18 Militar Jay COMANDO MILITAR 30182
19 AUX GT AUX -
20 AUX Thiaguin AUX -
21
22 PRF Kira CMD NOE 2649
23 Militar Naldo CMD-SPEED 1592
24
25 Civil Algodao COORD-CORE 1270
26
27 PRF Mancini SUP PRF 1923
28 Militar Apollo CMD-SPEED-M 12863
29 PRF Carol B CMD-BATEDORES-PRF 14279
30
31 Militar Wadrian Oliveira CMD-GAEP 3402
32 PRF Phelipe CMD DOA 23600
33 PRF Lin CMD-SPEED-PRF 19164
34 PRF Mota CMD SPEED PRF 20142
35 Militar Marcos H. COMANDO GTM 30212
36 Militar Teteh Romanato COORD MILITAR 30230
37
38
39
40
41
42
43
44 CGP Link CMD-CGP 15864
45
46
47 Civil Gabe COORD-CORE 7418
48 Militar Drey COORD-GOT 10834
49
50
51
52
53
54
55 COE GB Walker COORD-COE 3289
56
57
58

59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79 AUX Lord AUX -
80 AUX Delacruz AUX -
81
82 Militar Luna COORD MILITAR 1624
83 PRF Aline CMD-NOE 1385
84
85 Militar Geras CMD-GOT 1215
86
87
88

89
90
91
92
93
94
95
96
97
98
99 PRF Branca CMD-DOA-PRF 11487
100
666
Badges de Oficiais
101 COE
102 COE
103 COE
104 COE Kinng Deveras 2870
105 COE João Pereira 30497
106 COE Lisa Deveras 2594
107 COE Lean Mcqueen 1717
108 COE Alana Dyfamada 5567
109 COE May Neurose 5685
110 COE Anastacia B 30342
111 COE Mel Deveras 11608
112 COE Reyz Hertz 15495
113 COE Theo Semfuturo 18910
114 COE Ayla Capotaputa 21669

115 COE Ryan Santos 14791
116 COE José 1284
117 COE Diana Deveras 3839
118 COE Mell Deveras 14168
119 COE Paniicz Deveras 4295
120 COE Snow Capotaputa 122
121 Militar Bryan 22035
122 Militar Roger Guedes 26023
123 Militar Izzat Sacanagem 355
124 Militar Kingzxl V. 848
125 Militar Dedeco XN 3851
126 Militar Charlotte V. 126
127 Militar GB V. 14819
128 Militar Blzinha Mcqueen 1248
129 Militar Gabriel Lican 6185
130 Militar Cotonete Dbala 1582
131 Militar Raitz Koltz 29855
132 Militar Vitor Black 106
133 Militar Hayzen Sloan 14765
134 Militar Amandinha D. 30119
135 Militar Sagat Demon 1793
136 Militar Campos Campbell 25968
137 Militar Jhow Pixilingo 1818
138 Militar Nicoly Goti 23921
139 Militar Ayla D. 12801
140 Militar Nathalia Periculosidade 2322
141 Militar Andre Provocante 30198
142 Militar Alice'Maria 2725
143 Militar Teaga LideranÃ§a 2726
144 Militar Theo 12704

145 Militar King Blaank 30221
146 Militar Lunna 30228
147 Militar Neto Belga 3622
148 Militar Bart Wsa 4001
149 Militar Gustavo 30229
150 Militar Mr Abravanel 4334
151 Militar Antonella CaldinFrost M
152 Militar Danzil Noeda 5963
153 Militar Jonh 30237
154 Militar Bruninha Bocheca 1348
155 Militar Luan Kalib 30273
156 Militar Louco Escobar 7188
157 Militar Enrico Hills 7432
158 Militar Clara 16664
159 Militar Carol Karkov 8230
160 Militar Paola Karkov 8229
161 Militar Coelho Schweinsteiger 8092
162 Militar Neymarzinho Bala 30085
163 Militar Cariok Domantem 9560
164 Militar Lucas Silva 9713
165 Militar Ryuu Renegado 357
166 Militar Nika Paty 25929
167 Militar Raphinha Galado 10982
168 Militar Marconha Jane 11041
169 Militar Finalboss Nadamal 25804
170 Militar Marcio Sheik 20145
171 Militar Tuts Macabro 11791
172 Militar Jose Delacruz 11882
173 Militar Ezequiel F. 30329
174 Militar Vinix Odio 29919

175 Militar Rafa Love 12445
176 Militar Nikov Kalashnikov 12461
177 Militar Banzin M. 18155
178 Militar Falcon Silva 13375
179 Militar Cardoso Newbecker 13788
180 Militar Rafaelem Floren 13894
181 Militar Joao Lenceh 13922
182 Militar Mixirica M. 23520
183 Militar Plaq Abravanel 15639
184 Militar Laurinha B. 26080
185 Militar Coreia Romanov 15763
186 Militar Niel ogadofiel 1985
187 Militar Gabriel D 22777
188 Militar Quatro Abravanel 17179
189 Militar Taldochokito Aoleitedrits 17252
190 Militar Kaua XD 1665
191 Militar Thiago 30445
192 Militar Barbara Coutinho 18138
193 Militar Kauanxd Lycan 1665
194 Militar Dedeco XN 3851
195 Militar Miguel Macabro 18948
196 Militar NKT S. 9390
197 Militar Marcus Psyco 1153
198 Militar Lisa Deveras 2594
199 Militar Clara 16664
200 Militar Thiago 30445
201 Militar Jhulios W. 18
202 Militar Vini Leblanc 15338
203 Militar Becca Nag 28371
204 Militar Niellxd O. 1985

205 Militar Chuck Moedas 20069
206 Militar Madalena Chimarrao 20137
207 Militar Carol 8230
208 Militar Kauanxd Lycan 1665
209 Militar Matheus Ashford 21732
210 Militar Sami McL. 24675
211 Militar Yas DoLittle 22024
212 Militar Bryan Kane 22035
213 Militar Souza Martins 22045
214 Militar Fp Trem 22204
215 Militar Andin CryCry 30743
216 Militar Clara V. 25373
217 Militar Dedeco XN 3851
218 Militar Connor R. 30470
219 Militar Vitorinha B. 260
220 Militar Nicolas Santos 22806
221 Militar Joelitom Morfina 22969
222 Militar Lia B. 17491
223 Militar Froks 938
224 Militar
225 Militar Flavin Dugera 23359
226 Militar Kevin Bueno 23531
227 Ph Dagranja 23650
228 Militar Mafher Malada 23723
229 Militar Felipe Henrique 23808
230 Militar Lindomar Cha 23832
231 Militar Yuri Vittali 24039
232 Militar
233 Militar
234 Militar Gustavo Owen 24119

235 Militar
236 Militar
237 Militar Samara Dogemerebola 24221
238 Militar
239 Militar Jamal Lancaster 24240
240 Militar Night Rosa 24466
241 Militar
242 Militar
243 Militar Bryan Romanov 24601
244 Militar
245 Militar Arthur Mecmelt 24687
246 Militar Luna Elite 24714
247 Militar Dumall Cv 24721
248 Militar
249 Militar
250 Militar
251 Militar
252 Militar
253 Militar
254 Militar
255 Militar Gui Daniel 25576
256 Militar Fael System 25621
257 Militar
258 Militar Foguin Lenceh 25731
259 Militar Brian Lenceh 25732
260 Militar
261 Militar
262 Militar
263 Militar
264 Militar

265 Militar
266 Militar
267 Militar
268 Militar
269 Militar
270 Militar
271 Militar
272 Militar
273 Militar
274 Militar
275 Militar
276 Militar
277 Militar
278 Militar
279 Militar
280 Militar
281 Militar
282 Militar
283 Militar
284 Militar
285 Militar
286 Militar
287 Militar
288 Militar
289 Militar
290 Militar
291 Militar
292 PRF Souza Apolo 130
293 PRF Dante DrogoPeraya 14972
294 PRF Sync Rm 23903

295 PRF Levi Romario 29582
296 PRF Isa Eniessi 30804
297 PRF Obito Mitchel 19623
298 PRF
299 PRF Vitor WalkerBlanc 918
300 PRF Duquesa 128
301 PRF Lean Crimson 239
302 PRF Dabliu Imperios 1073
303 PRF Magrin P 24491
304 PRF Lua midnigth 13993
305 PRF Kennedy Braganca 1204
306 PRF Gabriel Expert 30786
307 PRF Dkzinho Ssk 28233
308 PRF Yula Darkreis 19687
309 PRF Elijah Stone 30380
310 PRF Tuts Dygeras 1502
311 PRF Xunin Dixavas 1480
312 PRF Agatha Realstk 30331
313 PRF Zequinha Silva 29677
314 PRF Zeca Vaz 19928
315 PRF Haru Brisan 1879
316 PRF Royal Matue 366
317 PRF Tigas Tiguento 29831
318 PRF Lucas Belga 1825
319 PRF Mirion Nx 25874
320 PRF Danone Vinsmoke 1581
321 PRF Cesc Fabregas 2296
322 PRF Kronos White 1554
323 PRF Mts Honey 2412
324 PRF Lcs Imperios 2438

325 PRF Marcela Alleko 2487
326 PRF Portegas Ace 30687
327 PRF Joao Silva 29692
328 PRF Felipe Gatto 29936
329 PRF Lucas Midnight 25900
330 PRF Lucas MIranda 24694
331 PRF Duda Jenner 2903
332 PRF Anastacia B 30342
333 PRF Bozo K 30671
334 PRF Ayla Martinelli 1308
335 PRF LeleoDixavas 3492
336 PRF Luiza Nosense 9334
337 PRF Lucas 16939
338 PRF Gabriel Vescrot 25237
339 PRF Laranjinha Pikadmell 3929
340 PRF Katarina Psico 1165
341 PRF Jully 5875
342 PRF Daniel China 25477
343 PRF Denny Saito 5420
344 PRF Pedro Ashford 6006
345 PRF Luazita kiss 9337
346 PRF Tj Alcapone 12035
347 PRF Pb sx 29741
348 PRF Tasuko Kurosaki 29806
349 PRF Erick Maktub 9631
350 PRF Everisto Akifuma 9317
351 PRF Tazio Canela 9332
352 PRF Luiz beretz 18940
353 PRF Leozin Jr 9458
354 PRF Pedrinn 6142

355 PRF Pele Caneladugiragira 10197
356 PRF Fox Bhz 22954
357 PRF Ronaldo 19533
358 PRF Rinozaza Danike 24093
359 PRF Gabriel Rlkk 1082
360 PRF Isaque Fps 24247
361 PRF Dante veneno 29441
362 PRF Tigas tiguento 29731
363 PRF Jett antiafeto 29990
364 PRF Kovaaks NS 6415
365 PRF Dugrau Penha 11994
366 PRF Shan Nagasaki 30123
367 PRF Miss Fhox 29900
368 PRF Felipe Gatto 29630
369 PRF Santos C 30326
370 PRF Wender Lima 13635
371 PRF Indiano Tekotek 29983
372 PRF Baiano D 30349
373 PRF Erick Phz 30456
374 PRF Duhcarmo 129
375 PRF Eren Scor 14577
376 PRF Romulo Rodrigues 15684
377 PRF Anastacia B. 30342
378 PRF Royal 366
379 PRF Levi Carvalho 15816
380 PRF Yoo Jae 1519
381 PRF Pedro Henrique 15900
382 PRF Quiel Santos 20015
383 PRF Baldo Justino 16701
384 PRF Tyler Void 16834

385 PRF Erick Maktub 9631
386 PRF Foxbhz 22954
387 PRF Haru Brisan 1879
388 PRF Zeca Vaz 19928
389 PRF Martins Walterw 22843
390 PRF
391 PRF Zeca Vaz 19928
392 PRF Rm Silva 19925
393 PRF Th Dias 19386
394 PRF Mateus Mota 20142
395 PRF Biro Leclerc 20157
396 PRF Enede Askv 20401
397 PRF
398 PRF
399 PRF
400 PRF Drake Brake 22285
401 PRF
402 PRF Kekel Dellacruz 22416
403 PRF Andrade M 17136
404 PRF Katarina Mendez 22536
405 PRF Pedro R. 30071
406 PRF Jax Akifuma 22630
407 PRF
408 PRF Mavie Alcapone 22796
409 PRF Mec Money 30188
410 PRF Brasa Brisan 11298
411 PRF Vr Minezz 3024
412 PRF
413 PRF
414 PRF Lancaster 23470

415 PRF Barros Vescrot 23472
416 PRF
417 PRF
418 PRF Minato Okamoto 30033
419 PRF Head Silva 30250
420 PRF Lucas Ns 23603
421 PRF Ejoo Targeryen 23790
422 PRF Beak Jin Oh 30328
423 PRF
424 PRF Duhcarmo 129
425 PRF
426 PRF
427 PRF
428 PRF Pijack Abutre 24370
429 PRF
430 PRF
431 PRF
432 PRF
433 PRF
434 PRF
435
436 PRF Ana White 13406
437 PRF
438 PRF
439 PRF
440 PRF
441 PRF
442 PRF
443 PRF
444 PRF Yoo Yae 1519

445 PRF
446 PRF
447 PRF Jn Afk 25447
448 PRF Don Corleone 25451
449 PRF
450 PRF LiaTrem 25505
451 PRF
452 PRF
453 PRF
454 PRF Minu Romario 25666
455 PRF
456 PRF
457 PRF Patati Kitmata 25891
458 PRF PatataKitmata 25892
459 PRF
460 PRF
461 PRF
462 PRF
463 PRF
464 PRF
465 PRF
466 PRF
467 PRF
468 PRF
469 PRF
470 PRF
471 PRF
472 PRF
473 PRF
474 PRF

475 PRF
476 PRF
477 PRF Civil Agiota Crente 103
478 Civil Hick Nsuperoaexb 119
479 Civil Kali 822
480 Civil Lopes 10406
481 Civil Sk Dycria 178
482 Civil Scarlet 833
483 Civil Tokyo Fnb 363
484 Civil Apollo Kray 921
485 Civil Lara Fivem 25760
486 Civil Lis Bolinhos 25881
487 Civil Vilela Gabbana 1194
488 Civil Francisco Junior 25441
489 Civil Asuna Yuuki 25617
490 Civil Nany N. 25644
491 Civil Thallas Imperios 1439
492 Civil Sasa Paty 1505
493 Civil Ton Hater 1578
494 Civil Alice Antilov 1594
495 Civil Silva 2987
496 Civil Teles Garimpado 25149
497 Civil Bojack Nolove 2155
498 Civil Rafaela Petrov 2745
499 Civil Miles Morales 2904
500 Civil Jota Reliquia 3079
501 Civil Orochi Maquiavel 3279
502 Civil Lari Awpe 3981
503 Civil Lucas Izback 25197

504 Civil Richard Daspatty 5329
505 Civil Bia Tchutchuka 5357
506 Civil Isaadoraleite Apanhadopai 6121
507 Civil Teteu Delacroix 6328
508 Civil Devil S. 2806
509 Civil Dacoro Lima 7223
510 Civil Muniz Cannabis 25369
511 Civil Cecilia Mourant 8106
512 Civil Lopes Dna 10406
513 Civil Egito Nc 10590
514 Civil Tenere Fps 10871
515 Civil Kali 822
516 Civil Japa Dk 11256
517 Civil Marcin N. 28381
518 Civil Henrique Sobral 12879
519 Civil Kante Chubecheki 13448
520 Civil Ketchup Abravaaneel 13992
521 Civil Maionese 13987
522 Civil Falcao Sloan 14846
523 Civil Kitsune Nolov 15302
524 Civil Adagomir Xbox 15740
525 Civil Luna Paty 16144
526 Civil Luck Blade 16157
527 Civil Frost Zerofoco 16813
528 Civil Brisaa Zerofoco 16837
529 Civil Xico V. 29430
530 Civil Rick Psy 3466
531 Civil Fest J. 177
532 Civil Santos Souza 18010
533 Civil Perola Walker 18185

534 Civil Luna Antilove 18297
535 Civil Th F. 132
536 Civil
537 Civil Wt Diminas 18974
538 Civil Kazuto Harper 25321
539 Civil Dante NoLove 19051
540 Civil Samurai Kitmaceta 19532
541 Civil Victor 22524
542 Civil Israel Machado 20246
543 Civil Juninho Cunha 21638
544 Civil Morena Deveras 21741
545 Civil Sete Qta 21937
546 Civil Madu K 23102
547 Civil Ashley Lancaster 22188
548 Civil
549 Civil Daniel Dybala 22802
550 Civil Pec 15632
551 Civil Carioca Smith 23110
552 Civil Clebeu Rosario 23192
553 Civil Kaliver Volkov 23272
554 Civil Pretinha Tereshkova 23401
555 Civil Nog Abravanel 23494
556 Civil Igor Hc 23654
557 Civil Jn Bigode 23799
558 Civil Ryan Silveira 17639
559 Civil
560 Civil Bigode Tx 24102
561 Civil Yakut H 20177
562 Civil Coreia 24281
563 Civil

564 Civil Big Zerofoco 24302
565 Civil Sync Silva 24427
566 Civil Breck Soares 24449
567 Civil Mica Cesar 24452
568 Civil Waast Soares 24560
569 Civil Jorge Martins 24702
570 Civil Guxta Santos 24814
571 Civil Claudinha Vga 24993
572 Civil Luaa Blair 25143
573 Civil Manu C. 28435
574 Civil Rick Psy. 3466
575 Civil Alana D. 25430
576 Civil Fest J. 177
577 Civil Th Ref. 1059
578 Civil Yan arruda 30539
579 Civil Ridrick S. 24298
580 Civil Bruno N. 30677
581 Civil Victor 22524
582 Civil Rikka T. 29675
583 Civil Lua Z. 3372
584 Civil Marcin N. 28381
585 Civil Lyza Sete 3443

586 Civil Maay Ferrari 414
587 Civil
588 Civil
589 Civil
590
591
592
593
594

595
666
667
668
669
670
671
672
673
674
675
676
677
678
679
680
681
682
683
684

685
686
687
688
689
690
691
692
693
694
695
696
697
698
699
700
`

// Função para gerar as viaturas a partir dos dados fornecidos
const generateVehicles = (): Vehicle[] => {
  const vehicles: Vehicle[] = []
  // Step 1: Initialize all 700 vehicles with a default
  for (let i = 1; i <= 700; i++) {
    vehicles.push({
      id: i,
      badge: i.toString().padStart(3, "0"),
      status: "disponivel",
      guarnicao: "MILITAR", // Default guarnicao, will be overridden by rules or officer data
      lastUpdate: new Date(),
      model: "Viatura Padrão",
      location: "Base Central",
      mileage: Math.floor(Math.random() * 200000) + 10000,
      priority: ["alta", "media", "baixa"][Math.floor(Math.random() * 3)] as "alta" | "media" | "baixa",
    })
  }

  // Step 2: Apply broad range rules for guarnicao
  // Badges 001-100: Restrito (não disponível para cadastro via formulário)
  // Badges 101-120: Restrito para COE
  // Badges 121-291: Restrito para MILITAR
  // Badges 292-477: Restrito para PRF
  // Badges 478-700: Restrito para CIVIL
  for (let i = 0; i < vehicles.length; i++) {
    const id = vehicles[i].id
    if (id >= 1 && id <= 100) {
      vehicles[i].guarnicao = "SEM_COR" // Usar SEM_COR para indicar restrição administrativa
    } else if (id >= 101 && id <= 120) {
      vehicles[i].guarnicao = "COE"
    } else if (id >= 121 && id <= 291) {
      vehicles[i].guarnicao = "MILITAR"
    } else if (id >= 292 && id <= 477) {
      vehicles[i].guarnicao = "PRF"
    } else if (id >= 478 && id <= 700) {
      vehicles[i].guarnicao = "CIVIL"
    }
  }

  // Step 3: Apply user-defined specific rules for guarnicao (these override broad rules for specific badges)
  const rules: { start: number; end: number; guarnicao: Guarnicao }[] = [
    { start: 1, end: 1, guarnicao: "CMD_G" },
    { start: 2, end: 2, guarnicao: "S_CMD_G" },
    { start: 3, end: 3, guarnicao: "PRF" },
    { start: 4, end: 7, guarnicao: "CIVIL" },
    { start: 8, end: 8, guarnicao: "PRF" },
    { start: 9, end: 9, guarnicao: "PRF" },
    { start: 10, end: 10, guarnicao: "MILITAR" },
    { start: 11, end: 13, guarnicao: "CIVIL" },
    { start: 14, end: 14, guarnicao: "COE" },
    { start: 15, end: 15, guarnicao: "CIVIL" },
    { start: 16, end: 16, guarnicao: "MILITAR" },
    { start: 17, end: 17, guarnicao: "CGP" },
    { start: 18, end: 18, guarnicao: "MILITAR" },
    { start: 19, end: 21, guarnicao: "AUX" },
    { start: 22, end: 22, guarnicao: "PRF" },
    { start: 23, end: 23, guarnicao: "MILITAR" },
    { start: 24, end: 26, guarnicao: "CIVIL" },
    { start: 27, end: 27, guarnicao: "PRF" },
    { start: 28, end: 28, guarnicao: "MILITAR" },
    { start: 29, end: 29, guarnicao: "PRF" },
    { start: 30, end: 30, guarnicao: "MILITAR" },
    { start: 31, end: 31, guarnicao: "MILITAR" },
    { start: 32, end: 34, guarnicao: "PRF" },
    { start: 35, end: 35, guarnicao: "MILITAR" },
    { start: 37, end: 43, guarnicao: "SEM_COR" },
    { start: 44, end: 44, guarnicao: "CGP" },
    { start: 45, end: 46, guarnicao: "MILITAR" },
    { start: 47, end: 47, guarnicao: "CIVIL" },
    { start: 48, end: 48, guarnicao: "MILITAR" },
    { start: 55, end: 55, guarnicao: "COE" },
    { start: 79, end: 79, guarnicao: "AUX" },
    { start: 80, end: 80, guarnicao: "AUX" },
    { start: 82, end: 82, guarnicao: "MILITAR" },
    { start: 83, end: 83, guarnicao: "PRF" },
    { start: 85, end: 85, guarnicao: "MILITAR" },
    { start: 99, end: 99, guarnicao: "PRF" },
  ]

  rules.forEach((rule) => {
    for (let i = rule.start; i <= rule.end; i++) {
      if (vehicles[i - 1]) {
        vehicles[i - 1].guarnicao = rule.guarnicao
      }
    }
  })

  // Step 4: Process rawOfficersData and apply officer/status overrides (highest precedence)
  const lines = rawOfficersData.split("\n")
  const guarnicaoPatterns = Object.keys(guarnicaoKeywords).sort((a, b) => b.length - a.length)

  lines.forEach((line) => {
    line = line.trim()
    if (
      !line ||
      line.startsWith("BadgeUnidadeNomeCargoID") ||
      line.startsWith("Badges de Comandos") ||
      line.startsWith("Badges de Oficiais") ||
      !/^\d+/.test(line)
    ) {
      return
    }

    const matchBadge = line.match(/^(\d+)/)
    if (!matchBadge) return

    const id = Number.parseInt(matchBadge[1], 10)
    const vehicle = vehicles[id - 1]

    if (vehicle) {
      let restOfString = line.substring(matchBadge[1].length).trim()
      let officerName: string | undefined
      let officerCargo: string | undefined
      let officerId: string | undefined

      // Try to find guarnicao keyword in the text and remove it
      for (const keyword of guarnicaoPatterns) {
        const regex = new RegExp(`^${keyword.replace(".", "\\.")}`, "i")
        if (restOfString.match(regex)) {
          // Update guarnicao if found in the officer data, but keep the rule-based one if no officer is assigned
          const guarnicaoFromText = guarnicaoKeywords[keyword as keyof typeof guarnicaoKeywords]
          if (guarnicaoFromText) {
            vehicle.guarnicao = guarnicaoFromText
          }
          restOfString = restOfString.replace(regex, "").trim()
          break
        }
      }

      // Extract officer ID from the end of the string (if it's purely numeric)
      const matchOfficerId = restOfString.match(/(\d+)$/)
      if (matchOfficerId && !isNaN(Number.parseInt(matchOfficerId[1], 10))) {
        officerId = matchOfficerId[1]
        restOfString = restOfString.substring(0, restOfString.length - officerId.length).trim()
      } else if (restOfString.endsWith("-")) {
        // Handle cases like "AUX-" where ID is "-"
        officerId = "-"
        restOfString = restOfString.slice(0, -1).trim()
      }

      // The remaining string is NameCargo
      const nameCargo = restOfString.replace(/\s+/g, " ").trim()

      if (nameCargo) {
        let foundCargo = false
        for (const cargoPattern of cargoPatterns) {
          if (nameCargo.endsWith(cargoPattern)) {
            officerCargo = cargoPattern
            officerName = nameCargo.substring(0, nameCargo.length - cargoPattern.length).trim()
            foundCargo = true
            break
          }
        }
        if (!foundCargo) {
          officerName = nameCargo // If no specific cargo pattern found, the whole thing is the name
        }
      }

      // Assign to vehicle
      if (officerName) {
        vehicle.officer = officerName
        vehicle.officerCargo = officerCargo
        vehicle.officerId = officerId
        vehicle.status = "em_uso"
      } else {
        // If no officer name is found, ensure status is available
        if (vehicle.status !== "manutencao" && vehicle.status !== "inativa") {
          vehicle.status = "disponivel"
        }
        vehicle.officer = undefined
        vehicle.officerCargo = undefined
        vehicle.officerId = undefined
      }
      vehicle.lastUpdate = new Date()
    }
  })

  return vehicles
}

const getInitialVehicles = () => {
  return generateVehicles()
}

export default function PoliceDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(getInitialVehicles())
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [guarnicaoFilter, setGuarnicaoFilter] = useState<string>("todas")
  const [currentPage, setCurrentPage] = useState(1)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [registeredOfficersLog, setRegisteredOfficersLog] = useState<RegistrationLogEntry[]>([]) // New state for log
  const [isAdmin, setIsAdmin] = useState(false) // Estado local para isAdmin, será atualizado via useEffect

  // Novo estado para a unidade selecionada no formulário de registro
  const [selectedUnitForForm, setSelectedUnitForForm] = useState<Guarnicao>("MILITAR")
  const itemsPerPage = 48

  // Atualizar o estado isAdmin com base na sessão
  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isAdminSession()
      setIsAdmin(adminStatus)
    }
    checkAdminStatus()
  }, [])

  // Atualizar horário em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Estatísticas simplificadas
  const stats = useMemo(() => {
    const disponivel = vehicles.filter((v) => v.status === "disponivel").length
    const emUso = vehicles.filter((v) => v.status === "em_uso").length
    const total = vehicles.length

    return { disponivel, emUso, total }
  }, [vehicles])

  // Estatísticas por guarnição
  const guarnicaoStats = useMemo(() => {
    const stats: Record<Guarnicao, { total: number; disponivel: number; emUso: number }> = {
      MILITAR: { total: 0, disponivel: 0, emUso: 0 },
      PRF: { total: 0, disponivel: 0, emUso: 0 },
      CIVIL: { total: 0, disponivel: 0, emUso: 0 },
      COE: { total: 0, disponivel: 0, emUso: 0 },
      CMD_G: { total: 0, disponivel: 0, emUso: 0 },
      S_CMD_G: { total: 0, disponivel: 0, emUso: 0 },
      CGP: { total: 0, disponivel: 0, emUso: 0 },
      AUX: { total: 0, disponivel: 0, emUso: 0 },
      SEM_COR: { total: 0, disponivel: 0, emUso: 0 },
    }

    vehicles.forEach((vehicle) => {
      stats[vehicle.guarnicao].total++
      if (vehicle.status === "disponivel") stats[vehicle.guarnicao].disponivel++
      if (vehicle.status === "em_uso") stats[vehicle.guarnicao].emUso++
    })

    return stats
  }, [vehicles])

  // Set of currently registered officer IDs for quick lookup
  const existingOfficerIds = useMemo(() => {
    const ids = new Set<string>()
    vehicles.forEach((v) => {
      if (v.officerId && v.status === "em_uso") {
        ids.add(v.officerId)
      }
    })
    return ids
  }, [vehicles])

  // Filtrar viaturas
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch =
        vehicle.badge.includes(searchTerm) ||
        vehicle.officer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.officerCargo?.toLowerCase().includes(searchTerm.toLowerCase()) || // Search by cargo
        vehicle.officerId?.includes(searchTerm) || // Search by ID
        guarnicaoConfig[vehicle.guarnicao].label.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "todos" || vehicle.status === statusFilter
      const matchesGuarnicao = guarnicaoFilter === "todas" || vehicle.guarnicao === guarnicaoFilter

      return matchesSearch && matchesStatus && matchesGuarnicao
    })
  }, [vehicles, searchTerm, statusFilter, guarnicaoFilter])

  // Paginação
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage)
  const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const updateVehicleStatus = (id: number, newStatus: VehicleStatus) => {
    setIsLoading(true)
    setTimeout(() => {
      console.log(`Atualizando viatura ${id} para status: ${newStatus}`)
      setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, status: newStatus, lastUpdate: new Date() } : v))) // Atualização real do estado
      setIsLoading(false)
    }, 500)
  }

  const refreshData = () => {
    setIsLoading(true)
    setTimeout(() => {
      setVehicles(getInitialVehicles()) // Re-gera os dados das viaturas
      setIsLoading(false)
    }, 1000)
  }

  // Funções para os botões do cabeçalho e mapa
  const handleAlerts = () => {
    console.log("Botão 'Alertas' clicado!")
    // The dialog will handle opening, no need for alert here.
  }

  const handleExport = async () => {
    setIsLoading(true)
    try {
      const input = document.getElementById("vehicle-grid-for-export")
      if (!input) {
        alert("Erro: Conteúdo para exportação não encontrado.")
        setIsLoading(false)
        return
      }

      const canvas = await html2canvas(input, {
        scale: 2, // Increase scale for better resolution in PDF
        useCORS: true, // Important for images if any
        logging: true,
        backgroundColor: "#ffffff", // Ensure white background for PDF
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4") // Portrait, millimeters, A4 size
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save("relatorio_badges_policia_oasis.pdf")
      alert("Relatório exportado com sucesso!")
    } catch (error) {
      console.error("Erro ao exportar PDF:", error)
      alert("Ocorreu um erro ao exportar o relatório.")
    } finally {
      setIsLoading(false)
    }
  }

  // Função para remover um oficial de uma viatura
  const handleDeleteOfficer = (badgeId: string) => {
    setIsLoading(true)
    setTimeout(() => {
      setVehicles((prevVehicles) => {
        const updatedVehicles = prevVehicles.map((v) => {
          if (v.badge === badgeId) {
            return {
              ...v,
              officer: undefined,
              officerCargo: undefined,
              officerId: undefined,
              status: "disponivel", // Retorna a viatura para disponível
              lastUpdate: new Date(),
            }
          }
          return v
        })
        alert(`Oficial removido da Viatura #${badgeId}.`)
        return updatedVehicles
      })
      setIsLoading(false)
    }, 500)
  }

  const handleViewMap = () => {
    console.log("Botão 'Visualizar Mapa' clicado!")
    alert("Abrindo visualização do mapa (funcionalidade a ser implementada).")
  }

  // Lista de badges disponíveis para o formulário de registro, baseada na unidade selecionada
  const availableBadgesForForm = useMemo(() => {
    return vehicles
      .filter((v) => {
        const isRestrictedBadge = v.id >= 1 && v.id <= 100
        // Se não for admin, badges restritas nunca estão disponíveis para cadastro normal.
        if (!isAdmin && isRestrictedBadge) {
          return false
        }
        // Se for admin, badges restritas estão disponíveis APENAS se a guarnição da badge
        // corresponder à unidade selecionada no formulário.
        // Badges não restritas estão disponíveis se estiverem 'disponivel' e corresponderem à unidade.
        return (
          v.status === "disponivel" &&
          v.guarnicao === selectedUnitForForm &&
          (!isRestrictedBadge || (isAdmin && v.guarnicao === selectedUnitForForm))
        )
      })
      .map((v) => ({ value: v.badge, label: `Badge ${v.badge}` }))
  }, [vehicles, selectedUnitForForm, isAdmin])

  // Função para lidar com a mudança de unidade no formulário de registro
  const handleUnitChangeForForm = (unit: Guarnicao) => {
    setSelectedUnitForForm(unit)
  }

  // Função para lidar com o registro de um novo oficial
  const handleRegisterOfficer = (
    officerName: string,
    unit: Guarnicao,
    selectedBadge: string,
    officerCargo: string | undefined, // Cargo agora pode ser undefined
    officerId: string, // ID do Oficial agora é obrigatório
  ) => {
    setIsLoading(true)
    setTimeout(() => {
      setVehicles((prevVehicles) => {
        const updatedVehicles = [...prevVehicles]
        const vehicleToUpdate = updatedVehicles.find((v) => v.badge === selectedBadge && v.guarnicao === unit)

        // A validação de duplicidade já ocorre.
        if (existingOfficerIds.has(officerId)) {
          alert(`Erro: O ID do Oficial "${officerId}" já está cadastrado.`)
          setIsLoading(false)
          return prevVehicles
        }

        if (vehicleToUpdate && vehicleToUpdate.status === "disponivel") {
          const isRestrictedBadge = vehicleToUpdate.id >= 1 && vehicleToUpdate.id <= 100
          if (isRestrictedBadge && !isAdmin) {
            alert(`Erro: A badge #${selectedBadge} é restrita e só pode ser cadastrada por um administrador.`)
            setIsLoading(false)
            return prevVehicles
          }
          if (isRestrictedBadge && isAdmin && vehicleToUpdate.guarnicao !== unit) {
            alert(
              `Erro: A badge #${selectedBadge} pertence à guarnição ${guarnicaoConfig[vehicleToUpdate.guarnicao].label}. Um administrador só pode cadastrá-la para sua guarnição designada.`,
            )
            setIsLoading(false)
            return prevVehicles
          }

          vehicleToUpdate.officer = officerName
          vehicleToUpdate.officerCargo = officerCargo || "Oficial" // Usa o cargo fornecido ou "Oficial" como padrão
          vehicleToUpdate.officerId = officerId // Atribui o ID do oficial diretamente
          vehicleToUpdate.status = "em_uso"
          vehicleToUpdate.lastUpdate = new Date()

          setRegisteredOfficersLog((prevLog) => {
            const newEntry: RegistrationLogEntry = {
              officerName,
              officerId: vehicleToUpdate.officerId,
              officerCargo: vehicleToUpdate.officerCargo, // Adiciona o cargo ao log
              badge: selectedBadge,
              unit,
              timestamp: new Date(),
            }
            return [newEntry, ...prevLog].slice(0, 10)
          })

          alert(
            `Oficial ${officerName} (ID: ${vehicleToUpdate.officerId}) cadastrado na Viatura #${vehicleToUpdate.badge} (${unit})!`,
          )
        } else {
          alert(
            `A Viatura #${selectedBadge} da unidade ${guarnicaoConfig[unit].label} não está disponível ou não existe.`,
          )
        }
        setIsLoading(false)
        return updatedVehicles
      })
    }, 500)
  }

  const guarnicaoOptions = useMemo(() => {
    return Object.keys(guarnicaoConfig).map((key) => ({
      value: key as Guarnicao,
      label: guarnicaoConfig[key as Guarnicao].label,
    }))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern Moderno */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.1) 2px, transparent 0),
                    radial-gradient(circle at 75px 75px, rgba(99, 102, 241, 0.1) 2px, transparent 0)`,
            backgroundSize: "100px 100px",
          }}
        ></div>
      </div>

      {/* Elementos Decorativos Flutuantes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-xl animate-float"></div>
      <div
        className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-xl animate-float"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-xl animate-float"
        style={{ animationDelay: "4s" }}
      ></div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Ultra Moderno */}
          <div className="glass rounded-3xl p-8 hover-lift">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-2 bg-transparent rounded-2xl">
                      <Image
                        src="/images/police-oasis-logo.png"
                        alt="Departamento de Polícia Oasis Logo"
                        width={80}
                        height={80}
                        className="rounded-full shadow-2xl"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                      Central de badges policia oasis
                    </h1>
                    <p className="text-gray-600 font-semibold text-lg flex items-center gap-2 mt-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      Sistema Integrado de Guarnições • Badges 001-700
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        Online
                      </Badge>
                    </p>
                  </div>
                </div>

                {/* Informações em Tempo Real */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono">{currentTime.toLocaleTimeString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Sistema Nacional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span>{Object.keys(guarnicaoConfig).length} Guarnições Ativas</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="glass border-0 hover:bg-white/50 backdrop-blur-sm bg-transparent"
                  onClick={refreshData}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="glass border-0 hover:bg-white/50 backdrop-blur-sm bg-transparent"
                      onClick={handleAlerts}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Alertas
                      {registeredOfficersLog.length > 0 && (
                        <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                          {registeredOfficersLog.length}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] glass border-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-teal-500/5 to-cyan-500/5"></div>
                    <DialogHeader className="relative">
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                        Últimos Cadastramentos
                      </DialogTitle>
                      <DialogDescription className="text-base">
                        Visualize os oficiais e viaturas cadastrados recentemente.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto relative">
                      {registeredOfficersLog.length === 0 ? (
                        <p className="text-center text-gray-500">Nenhum cadastramento recente.</p>
                      ) : (
                        registeredOfficersLog.map((entry, index) => (
                          <Card key={index} className="glass border-0 hover-lift overflow-hidden">
                            <CardContent className="p-4 flex items-center gap-4">
                              <div
                                className={`p-2 rounded-full ${
                                  guarnicaoConfig[entry.unit]?.color
                                    ? `bg-gradient-to-r ${guarnicaoConfig[entry.unit].color}`
                                    : "bg-gray-200"
                                }`}
                              >
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-lg font-semibold text-gray-800">
                                  {entry.officerName} (ID: {entry.officerId || "N/A"})
                                </p>
                                {entry.officerCargo && (
                                  <p className="text-sm text-gray-600">Cargo: {entry.officerCargo}</p>
                                )}
                                <p className="text-sm text-gray-600">
                                  Viatura #{entry.badge} -{" "}
                                  <Badge className={`${guarnicaoConfig[entry.unit].badgeColor} text-xs`}>
                                    {guarnicaoConfig[entry.unit].label}
                                  </Badge>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Cadastrado em: {entry.timestamp.toLocaleString("pt-BR")}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="glass border-0 hover:bg-white/50 backdrop-blur-sm bg-transparent"
                  onClick={handleExport}
                  disabled={isLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>

                {/* Botão de Logout */}
                <form action={logout}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="glass border-0 hover:bg-white/50 backdrop-blur-sm bg-transparent"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Formulário de Cadastro de Oficial */}
          {isAdmin && ( // Renderiza o formulário apenas se for admin
            <RegistrationForm
              onRegister={handleRegisterOfficer}
              guarnicaoOptions={guarnicaoOptions}
              availableBadgesForSelectedUnit={availableBadgesForForm}
              onUnitChange={handleUnitChangeForForm}
              isAdmin={isAdmin}
            />
          )}

          {/* Estatísticas por Guarnição */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(guarnicaoConfig).map(([key, config]) => {
              const guarnicao = key as Guarnicao
              const guarnicaoStatsData = guarnicaoStats[guarnicao]
              return (
                <Card key={guarnicao} className="glass border-0 hover-lift group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-gray-50/30"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 bg-gradient-to-r ${config.color} rounded-xl shadow-lg group-hover:shadow-xl transition-all`}
                      >
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <Badge className={`${config.badgeColor} text-sm px-3 py-1`}>{config.label}</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Total</span>
                        <span className="text-2xl font-bold text-gray-900">{guarnicaoStatsData.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-600">Em Uso</span>
                        <span className="text-lg font-bold text-blue-700">{guarnicaoStatsData.emUso}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-emerald-600">Disponível</span>
                        <span className="text-lg font-bold text-emerald-700">{guarnicaoStatsData.disponivel}</span>
                      </div>
                      <Progress
                        value={
                          guarnicaoStatsData.total > 0
                            ? ((guarnicaoStatsData.disponivel + guarnicaoStatsData.emUso) / guarnicaoStatsData.total) *
                              100
                            : 0
                        }
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Estatísticas Gerais - Apenas 2 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Badges em Uso */}
            <Card className="glass border-0 hover-lift group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
              <CardContent className="p-8 relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all">
                    <Car className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-sm px-3 py-1">Em Uso</Badge>
                </div>
                <div className="space-y-4">
                  <p className="text-5xl font-black text-blue-700">{stats.emUso}</p>
                  <p className="text-lg text-blue-600 font-semibold">Badges ativas</p>
                  <Progress value={(stats.emUso / stats.total) * 100} className="h-3" />
                  <p className="text-sm text-blue-500 font-medium">Badges atualmente em operação</p>
                </div>
              </CardContent>
            </Card>

            {/* Badges Disponíveis */}
            <Card className="glass border-0 hover-lift group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5"></div>
              <CardContent className="p-8 relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-sm px-3 py-1">
                    Disponível
                  </Badge>
                </div>
                <div className="space-y-4">
                  <p className="text-5xl font-black text-emerald-700">{stats.disponivel}</p>
                  <p className="text-lg text-emerald-600 font-semibold">Badges disponíveis</p>
                  <Progress value={(stats.disponivel / stats.total) * 100} className="h-3" />
                  <p className="text-sm text-emerald-500 font-medium">Badges prontas para uso imediato</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros Ultra Modernos */}
          <Card className="glass border-0 hover-lift overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
            <CardHeader className="pb-4 relative">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 rounded-xl shadow-lg">
                  <Filter className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Filtros Inteligentes
                  </CardTitle>
                  <CardDescription className="text-base">
                    Encontre viaturas rapidamente com busca avançada e filtros por guarnição
                  </CardDescription>
                </div>
                <div className="ml-auto">
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                    {filteredVehicles.length} resultados
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                      placeholder="🔍 Buscar por oficial, badge, cargo ou guarnição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-14 bg-white/50 border-gray-200 focus:bg-white focus:border-indigo-300 focus:ring-indigo-200 transition-all text-base rounded-xl"
                    />
                  </div>
                </div>
                <Select value={guarnicaoFilter} onValueChange={setGuarnicaoFilter}>
                  <SelectTrigger className="w-full lg:w-48 h-14 bg-white/50 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 rounded-xl text-base">
                    <SelectValue placeholder="Guarnição" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="todas">🏛️ Todas Guarnições</SelectItem>
                    {Object.keys(guarnicaoConfig).map((key) => (
                      <SelectItem key={key} value={key}>
                        {guarnicaoConfig[key as Guarnicao].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Viaturas - Layout Retangular com Guarnições */}
          <Card className="glass border-0 hover-lift overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-teal-500/5"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 via-cyan-600 to-teal-600 rounded-xl shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      Badges Ativas ({filteredVehicles.length})
                    </CardTitle>
                    <CardDescription className="text-base">
                      Página {currentPage} de {totalPages} • {paginatedVehicles.length} viaturas exibidas
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="glass border-0 hover:bg-white/50 bg-transparent"
                  onClick={handleViewMap}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar Mapa
                </Button>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div id="vehicle-grid-for-export" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedVehicles.map((vehicle) => {
                  const statusInfo = statusConfig[vehicle.status]
                  const guarnicaoInfo = guarnicaoConfig[vehicle.guarnicao]
                  const StatusIconComponent = statusInfo.icon

                  return (
                    <div
                      key={vehicle.id}
                      className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-md overflow-hidden hover-lift relative rounded-xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Header Colorido por Guarnição */}
                      <div className={`h-3 bg-gradient-to-r ${guarnicaoInfo.color} relative`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                      </div>

                      <div className="p-4 relative">
                        {/* Layout Horizontal */}
                        <div className="flex items-center justify-between gap-4">
                          {/* Lado Esquerdo - Badge e Status */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
                                #{vehicle.badge}
                              </span>
                              {vehicle.priority === "alta" && (
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${guarnicaoInfo.badgeColor} text-xs px-2 py-1`}>
                                {guarnicaoInfo.label}
                              </Badge>
                              <Badge className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1 px-2 py-1 text-xs">
                                <StatusIconComponent className="w-3 h-3" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Lado Direito - Status Selector e Botão de Excluir */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="w-32">
                              <Select
                                value={vehicle.status}
                                onValueChange={(value) => updateVehicleStatus(vehicle.id, value as VehicleStatus)}
                                disabled={isLoading || !isAdmin} // Desabilita se não for admin
                              >
                                <SelectTrigger className="w-full h-8 text-xs bg-gray-50 border-gray-200 hover:bg-white focus:bg-white transition-colors rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-50">
                                  <SelectItem value="disponivel">✅ Disponível</SelectItem>
                                  <SelectItem value="em_uso">🚔 Em Uso</SelectItem>
                                  <SelectItem value="manutencao">🔧 Manutenção</SelectItem>
                                  <SelectItem value="inativa">⚠️ Inativa</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {isAdmin && vehicle.officer && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleDeleteOfficer(vehicle.badge)}
                                disabled={isLoading}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Remover Oficial
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Informações do Oficial (Bonequinho, Nome, ID, Cargo) */}
                        {vehicle.officer && (
                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-full">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-800">{vehicle.officer}</span>
                              {vehicle.officerCargo && (
                                <span className="text-xs text-gray-500">{vehicle.officerCargo}</span>
                              )}
                              {vehicle.officerId && (
                                <span className="text-xs text-gray-500">ID: {vehicle.officerId}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Data de Atualização */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 pt-2 mt-2 border-t border-gray-100">
                          <Clock className="w-3 h-3" />
                          <span>Atualizado {vehicle.lastUpdate.toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Paginação Ultra Moderna */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10 pt-8 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="glass border-0 hover:bg-white/70 px-6 py-3"
                  >
                    ← Anterior
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      let page
                      if (totalPages <= 7) {
                        page = i + 1
                      } else if (currentPage <= 4) {
                        page = i + 1
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i
                      } else {
                        page = currentPage - 3 + i
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={
                            currentPage === page
                              ? "bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-xl hover-lift px-4 py-3"
                              : "glass border-0 hover:bg-white/70 px-4 py-3"
                          }
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="glass border-0 hover:bg-white/70 px-6 py-3"
                  >
                    Próxima →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

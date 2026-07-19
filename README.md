# Flash Royale

Трекер флешок із покращеннями для досягнення **Флешка-рояль** у *S.T.A.L.K.E.R. 2: Heart of Chornobyl*.

## Що вміє (етап 1–2)

- Список унікальних креслень з фільтрами (регіон, тип, предмет, статус)
- Режим **Перевірка в КПК** — по кожній зброї / шолому / броні
- **Мапа КПК** — оригінальні PDA-тайли гри (joric) + маркери флешок
- Сюжетні блокування + вибори проходження (Іскра / Полісся / Нінт)
- Позначки PS5 (без читів)
- Прогрес: локально (`localStorage`) або хмара (**Clerk + Convex**)

## Запуск

```bash
npm install
npm run dev
```

Без ключів додаток працює в **локальному режимі**.

### Хмара (Clerk + Convex)

1. Створи проєкти [Clerk](https://clerk.com) і [Convex](https://convex.dev)
2. Скопіюй `.env.example` → `.env.local` і заповни ключі
3. У Clerk створи JWT Template з назвою `convex`
4. У Convex env додай `CLERK_JWT_ISSUER_DOMAIN`
5. Запусти:

```bash
npx convex dev
npm run dev
```

## Дані

- `src/data/gear.json` — спорядження
- `src/data/flashdrives.json` — локації флешок (`worldX`/`worldY` з Steam teleport guide; альтернативні точки зведені в один `blueprintKey` для прогресу)

Джерела: Xbox Achievements guide, Steam blueprint coordinates, MapGenie (Upgrade).
Мапа: [joric/stalker2_tileset](https://github.com/joric/stalker2_tileset) (PDA texture, не офіційний продукт GSC).

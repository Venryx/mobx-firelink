# MobX Firelink

Integrate Firebase data into MobX and React with declarative path requests.

### Installation

```
npm install mobx-firelink --save-exact
```

The `--save-exact` flag is recommended, since this package uses [Explicit Versioning](https://medium.com/sapioit/why-having-3-numbers-in-the-version-name-is-bad-92fc1f6bc73c) (`Release.Breaking.FeatureOrFix`) rather than SemVer (`Breaking.Feature.Fix`).

To let npm increment `FeatureOrFix` (recommended), prepend "`~`" to its version in `package.json`. (for `Breaking`, prepend "`^`")

### Setup

TODO

### Usage

TODO

### Alternatives

If this library's approach doesn't match your preferences, the below is a list of alternative libraries for binding firebase data to MobX observables. They are ordered by how complete, well-designed, and well-maintained I personally view each to be; however, I only took a brief look at most of them, so the ordering (other than the top few) is approximate and pretty subjective.

For Firestore:

1) https://github.com/IjzerenHein/firestorter
1) https://github.com/giladv/orkan
1) https://github.com/0x80/firestore-mobx
1) https://github.com/rakannimer/react-firebase
1) https://github.com/sampsonjoliver/react-firestore-mobx
1) https://github.com/thdk/firestorable
1) https://github.com/mwikstrom/firemob

For Firebase RTD:

1) https://github.com/rakannimer/mobx-firebase-database
1) https://github.com/besync/graphstore
1) https://github.com/rakannimer/mobx-fire
1) https://github.com/liron00/mframework

<details>
<summary>Deprecated, repo removed, or very old/unmaintained (2.5+ yrs)</summary>
<p>
For Firestore:

1) https://www.npmjs.com/package/mobx-firestore (repo removed)
1) https://www.npmjs.com/package/mobx-firestore-model (repo removed)

For Firebase RTD:

1) https://github.com/iamdanthedev/mobase (old)
1) https://github.com/nyura123/mobx-firebase-store (old)
1) https://github.com/agonbina/mobx-firebase (old)
1) https://github.com/nyura123/firebase-nest-mobx-react (deprecated, old)
1) https://github.com/GeekyAnts/mobx-state-tree-firebase (deprecated)
</p>
</details>
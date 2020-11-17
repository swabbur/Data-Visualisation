# Data Visualisation

## Alternative Datasets

### World
- ![Development](http://wdi.worldbank.org/tables)
- ![Boundaries](https://datacatalog.worldbank.org/dataset/world-bank-official-boundaries)
- ![Elevation](https://datacatalog.worldbank.org/dataset/world-terrain-elevation-above-sea-level-ele-gis-data-global-solar-atlas)

### Other
- ![Pokemon](https://pokeapi.co/docs/v2)

## Instructions

### Downloading the Dataset

As the dataset is provided by an external website, we decided to use a script to download, unzip, parse, and merge the different data files into a single CSV file. To run this script, one should first install the required Python packages:

```
pip3 install -r requirements.txt
```

Then, the dataset can be downloaded:

```bash
python3 scripts/download.py
```

The dataset can be found at: `data/dataset.csv`.

### Viewing the Visualisations

The visualisations were created using D3. Make sure you have downloaded the dataset and then open any of the HTML files in the visualisations directory to view the data.

# Data-Visualisation

## Downloading the Dataset

As the dataset is provided by an external website, we decided to use a script to download, unzip, parse, and merge the different data files into a single CSV file. To run this script, one should first install the required Python packages:

```
pip3 install -r requirements.txt
```

Then, the dataset can be downloaded:

```bash
python3 scripts/download.py
```

The dataset can be found at: `data/dataset.csv`.

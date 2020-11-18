# Data Visualisation

## Instructions

### Downloading the Dataset

As the dataset is stored externally, we decided to use a script to download, unpack, convert, and clean the data files. To run this script, one should install Python3, gather the the required Python packages, and execute it. The exact commands may differ per platform, the following should work on any Linux system running the APT package manager.

```
sudo apt install pip3 python3
pip3 install -r requirements.txt
python3 scripts/download.py
```

All data, including the intermediary formats, are stored in a newly generated `data` folder.

### Viewing the Visualisations

The visualisations were created using D3. Make sure you have downloaded the dataset and then open any of the HTML files in the visualisations directory to view the data.

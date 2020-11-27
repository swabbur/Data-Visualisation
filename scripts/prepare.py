import pandas
import requests
import shutil

from pathlib import Path


def download_all(urls: [str], target_directory: Path):
    """Download the online resources and store them in the target directory."""
    for url in urls:
        file_path = target_directory / url.split("/")[-1]
        if not file_path.exists():
            print(f"Downloading {url} to {file_path}.")
            with requests.get(url, stream=True, allow_redirects=True) as response:
                response.raise_for_status()
                with file_path.open("wb") as file:
                    for chunk in response.iter_content(chunk_size=2 ** 16):
                        file.write(chunk)


def convert_all(source_directory: Path, target_directory: Path):
    """Convert all text files in the source directory to UTF-8 encoded CSV files."""
    for file_path in source_directory.iterdir():
        target_path = (target_directory / file_path.name).with_suffix(".csv")
        if not target_path.exists():
            print(f"Converting {file_path} to {target_path}.")
            if file_path.suffix == ".csv":
                shutil.copyfile(file_path, target_path)
            if file_path.suffix == ".xls" or file_path.suffix == ".xlsx":
                convert_excel(file_path, target_path)
            else:
                raise RuntimeError(f"Cannot convert {file_path} to CSV")


def convert_excel(source_path: Path, target_path: Path):
    """Convert an excel file to a CSV file."""
    data_frame = pandas.read_excel(str(source_path))
    data_frame.to_csv(target_path, encoding="utf-8", index=False)


def clean_kwb(source_path: Path, target_path: Path):
    """Clean a KWB file."""
    if not target_path.exists():
        print(f"Cleaning {source_path} to {target_path}")

        # Select, order, and rename columns
        columns = {
            "recs": "category",
            "gm_naam": "municipality",
            "regio": "name",
            "a_inw": "population",
            "bev_dich": "population_density",
            "a_woning": "house_count",
            "g_woz": "house_price",
            "p_leegsw": "available_house_percentage",
            "g_wodief": "theft",
            "g_vernoo": "destruction",
            "g_gewsek": "violence",
            "g_afs_hp": "doctor_distance",
            "g_afs_gs": "market_distance",
            "g_afs_kv": "daycare_distance",
            "g_afs_sc": "school_distance",
            "g_3km_sc": "school_count",
            "ste_mvs": "urbanity",
            "ste_oad": "house_density",
        }
        data_frame = pandas.read_csv(source_path)
        data_frame = data_frame[columns.keys()]
        data_frame.rename(columns=columns, inplace=True)

        # Translate dutch words
        translations = {
            "Land": "country",
            "Gemeente": "municipality",
            "Wijk": "district",
            "Buurt": "neighbourhood",
        }
        data_frame.replace(translations.keys(), translations.values(), inplace=True)

        # Store clean data frame
        data_frame.to_csv(target_path, index=False)


def main():
    """Download, convert, clean, and pre-process online resources for future visualisation."""

    # Prepare data directory
    data_dir = Path("data")
    data_dir.mkdir(parents=True, exist_ok=True)

    # Download online resources
    urls = [
        "https://www.cbs.nl/-/media/cbs/dossiers/nederland-regionaal/wijk-en-buurtstatistieken/_exel/kwb-2019.xls",
    ]
    download_dir = data_dir / "downloaded"
    download_dir.mkdir(parents=True, exist_ok=True)
    download_all(urls, download_dir)

    # Convert all resources to CSV files
    convert_dir = data_dir / "converted"
    convert_dir.mkdir(parents=True, exist_ok=True)
    convert_all(download_dir, convert_dir)

    # Clean
    clean_dir = data_dir / "cleaned"
    clean_dir.mkdir(parents=True, exist_ok=True)
    clean_kwb(convert_dir / "kwb-2019.csv", clean_dir / "kwb-2019.csv")

    # Pre-process
    # Actual factors to present

    # Split
    # Country, municipalities, districts, neighbourhoods.
    # Can we create provinces from this data?


if __name__ == '__main__':
    main()

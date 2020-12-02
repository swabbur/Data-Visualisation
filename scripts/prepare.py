import pandas
import cbsodata

from functools import reduce
from pathlib import Path


def download(identifier: str):
    """Download a dataset from the CBS odata portal."""

    # Prepare download directory
    download_directory = Path("data/downloaded")
    download_directory.mkdir(parents=True, exist_ok=True)

    # Check if dataset was previously downloaded
    file_path = download_directory / (identifier + ".csv")
    if not file_path.exists():

        # Download dataset
        data = cbsodata.get_data(identifier)
        data_frame = pandas.DataFrame(data)
        print(data_frame)
        data_frame.to_csv(file_path, index=False)


def clean(identifier: str):
    """Clean a dataset by renaming and joining its columns."""

    # Prepare download directory
    download_directory = Path("data/downloaded")
    download_directory.mkdir(parents=True, exist_ok=True)

    # Prepare clean directory
    clean_directory = Path("data/cleaned")
    clean_directory.mkdir(parents=True, exist_ok=True)

    # Check if dataset was previously cleaned
    target_path = clean_directory / (identifier + ".csv")
    if not target_path.exists():
        source_path = download_directory / (identifier + ".csv")
        data_frame = pandas.read_csv(source_path)
        # data_frame.to_csv(target_path, index=False)


def join(identifiers: [str]):
    """Join a group of datasets together into a single group,"""

    # Prepare clean directory
    clean_directory = Path("data/cleaned")
    clean_directory.mkdir(parents=True, exist_ok=True)

    # Prepare join directory
    join_directory = Path("data/joined")
    join_directory.mkdir(parents=True, exist_ok=True)

    # Check if datasets were previously joined
    target_path = join_directory / ("_".join(identifiers) + ".csv")
    if not target_path.exists():

        def load(identifier: str) -> pandas.DataFrame:
            """Load the dataset associated with the given identifier."""
            source_path = clean_directory / (identifier + ".csv")
            return pandas.read_csv(source_path)

        def merge(accumulator: pandas.DataFrame, other: pandas.DataFrame) -> pandas.DataFrame:
            """Merge the given datasets into a single dataset via outer joining on shared columns."""
            columns = list(set(accumulator.columns).intersection(set(other.columns)))
            return pandas.merge(accumulator, other, how="outer", on=columns)

        # Join datasets
        data_frame = reduce(merge, map(load, identifiers))
        print(data_frame)
        data_frame.to_csv(target_path, index=False)


def prepare():
    """Download, clean, join, and order datasets."""
    identifiers = ["84583NED", "84718NED"]
    for identifier in identifiers:
        download(identifier)
        clean(identifier)
    # join(identifiers)


if __name__ == '__main__':
    prepare()

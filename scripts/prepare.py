import cbsodata
import pandas

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

        # Clean dataset
        source_path = download_directory / (identifier + ".csv")
        data_frame = pandas.read_csv(source_path)

        # Remove whitespace
        for column in data_frame.columns:
            if pandas.api.types.is_string_dtype(data_frame[column]):
                data_frame[column] = data_frame[column].str.strip()

        # Remove and rename columns
        columns = {

            # General
            "Gemeentenaam_1": "municipality",
            "SoortRegio_2": "type",
            "WijkenEnBuurten": "name",
            "Codering_3": "code",

            # Price
            "GemiddeldeWoningwaarde_35": "house_worth",

            # Urbanity
            "AantalInwoners_5": "inhabitants",
            "HuishoudensTotaal_28": "households",
            "Bevolkingsdichtheid_33": "density",
            "MateVanStedelijkheid_105": "urbanity",

            # Safety
            "TotaalDiefstalUitWoningSchuurED_78": "theft",
            "VernielingMisdrijfTegenOpenbareOrde_79": "destruction",
            "GeweldsEnSeksueleMisdrijven_80": "violence",

            # Healthcare
            "AfstandTotHuisartsenpraktijk_5": "distance_to_general_practitioner",
            "AfstandTotHuisartsenpost_9": "distance_to_general_practice",
            "AfstandTotZiekenhuis_11": "distance_to_hospital",

            # Education
            "AfstandTotSchool_98": "distance_to_school",
        }
        columns = {key: columns[key] for key in data_frame.columns if key in columns}

        data_frame = data_frame[columns.keys()]
        data_frame.rename(columns=columns, inplace=True)

        # Rename types
        translations = {
            "Land": "country",
            "Gemeente": "municipality",
            "Wijk": "district",
            "Buurt": "neighbourhood",
        }
        data_frame["type"].replace(translations.keys(), translations.values(), inplace=True)

        # Store clean dataset
        data_frame.to_csv(target_path, index=False)


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
        data_frame.to_csv(target_path, index=False)


def preprocess(identifiers: [str]):
    """Preprocess joined dataset."""

    # Prepare join directory
    join_directory = Path("data/joined")
    join_directory.mkdir(parents=True, exist_ok=True)

    # Prepare preprocess directory
    preprocess_directory = Path("data/preprocessed")
    preprocess_directory.mkdir(parents=True, exist_ok=True)

    target_path = preprocess_directory / ("_".join(identifiers) + ".csv")
    if not target_path.exists():

        # Load dataset
        source_path = join_directory / ("_".join(identifiers) + ".csv")
        data_frame = pandas.read_csv(source_path)

        # TODO: Fill in missing values

        # Price
        data_frame["price"] = 1.0 / data_frame["house_worth"]
        data_frame["price"].fillna(1)
        data_frame.drop(columns=["house_worth"], inplace=True)

        # Urbanity
        data_frame["urbanity"] = data_frame["urbanity"] \
            * data_frame["density"] \
            * (data_frame["inhabitants"] + data_frame["households"])
        data_frame["urbanity"].fillna(0)
        data_frame.drop(columns=["inhabitants", "households", "density"], inplace=True)

        # Safety
        data_frame["safety"] = 1.0 / (data_frame["theft"] + data_frame["destruction"] + data_frame["violence"])
        data_frame["safety"].fillna(1)
        data_frame.drop(columns=["theft", "destruction", "violence"], inplace=True)

        # Healthcare
        healthcare_columns = [
            "distance_to_general_practitioner",
            "distance_to_general_practice",
            "distance_to_hospital"
        ]

        def weighted_minimum(row):
            return min(4 * row[0], 2 * row[1], 1 * row[2])

        data_frame["healthcare"] = 1.0 / data_frame[healthcare_columns].apply(weighted_minimum, axis=1)
        data_frame["healthcare"].fillna(1)
        data_frame.drop(columns=healthcare_columns, inplace=True)

        # Education
        data_frame["education"] = 1.0 / data_frame["distance_to_school"]
        data_frame["education"].fillna(1)
        data_frame.drop(columns=["distance_to_school"], inplace=True)

        # Store clean dataset
        data_frame.to_csv(target_path, index=False)


def split(identifiers: [str]):
    """Preprocess joined dataset."""

    # Prepare preprocess directory
    preprocess_directory = Path("data/preprocessed")
    preprocess_directory.mkdir(parents=True, exist_ok=True)

    # Prepare join directory
    split_directory = Path("data/split")
    split_directory.mkdir(parents=True, exist_ok=True)

    target_directory = split_directory / "_".join(identifiers)
    if not target_directory.exists():

        # Load dataset
        source_path = preprocess_directory / ("_".join(identifiers) + ".csv")
        data_frame = pandas.read_csv(source_path)

        # Normalize each subcategory
        # # Normalize data
        # for column in data_frame.columns:
        #     if pandas.api.types.is_numeric_dtype(data_frame[column]):
        #         min_value = data_frame[column].min()
        #         max_value = data_frame[column].max()
        #         data_frame[column] = (data_frame[column] - min_value) / (max_value - min_value)


def prepare():
    """Download, clean, join, and order datasets."""
    identifiers = ["84583NED", "84718NED"]
    for identifier in identifiers:
        download(identifier)
        clean(identifier)
    join(identifiers)
    preprocess(identifiers)
    split(identifiers)


if __name__ == '__main__':
    prepare()

import cbsodata
import math
import pandas
import matplotlib.pyplot as plt

from functools import reduce
from pathlib import Path
from sklearn.preprocessing import MinMaxScaler


def download(identifier: str):
    """Download a dataset from the CBS odata portal."""

    # Prepare download directory
    download_directory = Path("data/downloaded")
    download_directory.mkdir(parents=True, exist_ok=True)

    # Check if dataset was previously downloaded
    file_path = download_directory / (identifier + ".csv")
    if not file_path.exists():

        print(f"Downloading \"{identifier}\" to \"{file_path}\".")

        # Download dataset
        data = cbsodata.get_data(identifier)
        data_frame = pandas.DataFrame(data)
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

        print(f"Cleaning \"{identifier}\" to \"{target_path}\".")

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
            "SoortRegio_2": "type",
            "WijkenEnBuurten": "name",
            "Codering_3": "code",

            # Price
            "GemiddeldeWoningwaarde_35": "house_worth",

            # Urbanity
            "MateVanStedelijkheid_105": "urbanity",

            # Safety
            # "AantalInwoners_5": "inhabitants",
            # "TotaalDiefstalUitWoningSchuurED_78": "theft",
            # "VernielingMisdrijfTegenOpenbareOrde_79": "destruction",
            # "GeweldsEnSeksueleMisdrijven_80": "violence",

            # Healthcare
            "AfstandTotHuisartsenpraktijk_5": "distance_to_general_practitioner",
            "AfstandTotHuisartsenpost_9": "distance_to_general_practice",
            "AfstandTotZiekenhuis_11": "distance_to_hospital",

            # Education
            # "AfstandTotSchool_60": "distance_to_school_1",
            # "AfstandTotSchool_64": "distance_to_school_2",
            # "AfstandTotSchool_68": "distance_to_school_3",
            # "AfstandTotSchool_72": "distance_to_school_4",
            "AfstandTotSchool_98": "distance_to_school",

            # Transit
            "AfstandTotBelangrijkOverstapstation_91": "distance_to_public_transport",

            # Required facilities
            "AfstandTotApotheek_10": "distance_to_pharmacy",
            "AfstandTotGroteSupermarkt_24": "distance_to_grocery_store",
            "AfstandTotKinderdagverblijf_52": "distance_to_daycare",
            "AfstandTotBibliotheek_92": "distance_to_library",

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

        identifier_names = ", ".join(map(lambda identifier: f"\"{identifier}\"", identifiers))
        print(f"Joining {identifier_names} to \"{target_path}\".")

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

        print(f"Preprocessing \"{source_path}\" to \"{target_path}\".")

        # Fill in missing values
        region_types = ["country", "municipality", "district", "neighbourhood"]

        def fill_top_down(column):
            values = list()
            for index, row in data_frame.iterrows():
                level = region_types.index(row["type"])
                values = values[:level]
                value = row[column]
                if math.isnan(value):
                    value = values[-1]
                data_frame.loc[index, column] = value
                values.append(value)

        fill_top_down("house_worth")
        fill_top_down("urbanity")
        fill_top_down("distance_to_general_practitioner")
        fill_top_down("distance_to_general_practice")
        fill_top_down("distance_to_hospital")
        fill_top_down("distance_to_school")
        fill_top_down("distance_to_public_transport")
        fill_top_down("distance_to_pharmacy")
        fill_top_down("distance_to_grocery_store")
        fill_top_down("distance_to_daycare")
        fill_top_down("distance_to_library")

        # Normalize columns
        to_be_normalized = [
            "house_worth",
            "urbanity",
            "distance_to_general_practitioner",
            "distance_to_general_practice",
            "distance_to_hospital",
            "distance_to_school",
            "distance_to_public_transport",
        ]

        for column in to_be_normalized:
            if pandas.api.types.is_numeric_dtype(data_frame[column]):
                scaler = MinMaxScaler()
                data_frame[[column]] = scaler.fit_transform(data_frame[[column]])

        # Combine data columns

        # Price
        data_frame["price"] = 1.0 - data_frame["house_worth"]
        data_frame.drop(columns=["house_worth"], inplace=True)

        # Urbanity
        data_frame["urbanity"] = 1.0 - data_frame["urbanity"]

        # Safety
        # data_frame["safety"] = 1.0 / (data_frame["theft"] + data_frame["destruction"] + data_frame["violence"])
        # data_frame["safety"].fillna(1)
        # data_frame.drop(columns=["theft", "destruction", "violence"], inplace=True)

        # Healthcare
        healthcare_columns = [
            "distance_to_general_practitioner",
            "distance_to_general_practice",
            "distance_to_hospital"
        ]

        def weighted_minimum(row):
            return 1.0 - min(row[0], row[1] ** 2, row[2] ** 3)

        data_frame["healthcare"] = data_frame[healthcare_columns].apply(weighted_minimum, axis=1)
        data_frame.drop(columns=healthcare_columns, inplace=True)

        # Education
        data_frame["education"] = 1.0 - data_frame["distance_to_school"]
        data_frame.drop(columns=["distance_to_school"], inplace=True)

        # Public Transport
        data_frame["public_transport"] = 1.0 - data_frame["distance_to_public_transport"]
        data_frame.drop(columns=["distance_to_public_transport"], inplace=True)

        # Pharmacy
        data_frame["pharmacy"] = data_frame["distance_to_pharmacy"] < 5.0
        data_frame.drop(columns=["distance_to_pharmacy"], inplace=True)

        # Pharmacy
        data_frame["grocery_store"] = data_frame["distance_to_grocery_store"] < 5.0
        data_frame.drop(columns=["distance_to_grocery_store"], inplace=True)

        # Pharmacy
        data_frame["daycare"] = data_frame["distance_to_daycare"] < 5.0
        data_frame.drop(columns=["distance_to_daycare"], inplace=True)

        # Pharmacy
        data_frame["library"] = data_frame["distance_to_library"] < 5.0
        data_frame.drop(columns=["distance_to_library"], inplace=True)

        # Distribute by ranking
        for column in data_frame.columns:
            if pandas.api.types.is_float_dtype(data_frame[column]):

                values = sorted(data_frame[column])
                latest_value = None
                latest_rank = 0
                next_rank = 0
                max_rank = len(data_frame[column])
                ranks = []
                for value in values:
                    if latest_value is None or latest_value < value:
                        latest_rank = next_rank
                    ranks.append(latest_rank / max_rank)
                    next_rank += 1

                rank_dict = {value: rank for value, rank in zip(values, ranks)}
                data_frame[column] = data_frame[column].map(rank_dict)

        # Create histograms for distribution analysis
        histogram_directory = Path("data/histograms")
        histogram_directory.mkdir(parents=True, exist_ok=True)
        for column in data_frame.columns:
            if pandas.api.types.is_float_dtype(data_frame[column]):
                figure, ax = plt.subplots()
                data_frame[column].hist(bins=20, legend=True, ax=ax)
                figure.savefig(histogram_directory / (column + ".png"))

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

        print(f"Splitting datasets to \"{target_directory}\".")

        target_directory.mkdir(exist_ok=True, parents=True)

        # Load dataset
        source_path = preprocess_directory / ("_".join(identifiers) + ".csv")
        data_frame = pandas.read_csv(source_path)

        # Split and store dataset
        def select_region(region_range):
            region_row = data_frame.iloc[region_range[0]]
            region_data_frame = data_frame.iloc[region_range[0]:region_range[1]]
            return region_row["code"], region_data_frame, region_range[1]

        def iterate_region(parent_data_frame, parent_end, region_type):
            region_indices = parent_data_frame.index[parent_data_frame["type"] == region_type].tolist()
            if len(region_indices) > 0:
                region_ranges = zip(region_indices, region_indices[1:] + [parent_end])
                return map(select_region, region_ranges)
            return []

        def split_and_store(parent_data_frame, parent_end, region_types):
            if len(region_types) > 1:
                for region, region_data_frame, region_end in iterate_region(parent_data_frame, parent_end, region_types[0]):
                    split_and_store(region_data_frame, region_end, region_types[1:])
                    subregion_data_frame = region_data_frame[region_data_frame["type"] == region_types[1]]
                    subregion_data_frame.to_json(target_directory / (region + ".json"), orient="records")

        split_and_store(data_frame, -1, ["country", "municipality", "district", "neighbourhood"])


def prepare():
    """Download, clean, join, and order datasets."""
    identifiers = ["84583NED", "84718NED"]
    for identifier in identifiers:
        download(identifier)
    for identifier in identifiers:
        clean(identifier)
    join(identifiers)
    preprocess(identifiers)
    split(identifiers)


if __name__ == '__main__':
    prepare()

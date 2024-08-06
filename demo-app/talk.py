import argparse
import json
from pathlib import Path

def get_data(filename: Path):
    if filename.suffix == ".json":
        return json.loads(open(filename).read())
    raise ValueError(f"Unsupported file format: {filename.suffix}")

def generate_report(data: list[dict]):
    key_sizes = {key: max(len(str(entry[key])) for entry in data) for key in data[0].keys()}
    for key, size in key_sizes.items():
        print(f"{key.upper(): <{size}}", end=" | ")
    print("\n" + "=" * (3 * len(key_sizes)+ sum(key_sizes.values())))
    
    for entry in data:
        for key, size in key_sizes.items():
            print(f"{entry[key]: <{size}}", end=" | ")
        print("")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("filename", type=Path, required=True)
    args = parser.parse_args()
    data = get_data(args.filename)
    generate_report(data)

if __name__ == "__main__":
    main()
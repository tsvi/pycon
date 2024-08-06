import json
from pathlib import Path

def get_data(filename: Path):
    return json.loads(open(filename).read())

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
    data = get_data(filename=Path(__file__).parent / "data.json")
    generate_report(data)

if __name__ == "__main__":
    main()
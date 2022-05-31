import fs from "fs";

interface j {
    bankName: string;
    bins: string[];
    country: string;
}

let input: j[] = JSON.parse(fs.readFileSync("./output.json").toString());

let a = input.filter((e) => {
    if (e.bins.length == 0) {
        return false;
    }
    return true;
});

let f = a.map((e) => {
    e.bankName = e.bankName.toUpperCase().trim().replace(",", "");

    return e;
});

function replaceName(realWord: string, finderRegex: RegExp) {
    for (let bank of f) {
        if (finderRegex.test(bank.bankName)) {
            bank.bankName = realWord;
        }
    }
    return f;
}

function joinSimilar() {
    let tempDict: { [key: string]: j } = {};
    for (let bank of f) {
        try {
            if (bank.bankName in Object.keys(tempDict)) {
                tempDict[bank.bankName].bins = tempDict[
                    bank.bankName
                ].bins.concat(bank.bins);
            } else {
                tempDict[bank.bankName] = bank;
            }
        } catch (e) {
            console.log(e);
            // console.log("ERROR: ", bank, tempDict[bank.bankName]);
        }
    }

    return Object.values(tempDict);
}

function ijoinSimilar() {
    let tempDict: { [key: string]: j } = {};
    for (let bank of f) {
        try {
            if (bank.bankName in Object.keys(tempDict)) {
                tempDict[bank.bankName].bins = tempDict[
                    bank.bankName
                ].bins.concat(bank.bins);
            } else {
                tempDict[bank.bankName] = bank;
            }
        } catch (e) {
            console.log(e);
            // console.log("ERROR: ", bank, tempDict[bank.bankName]);
        }
    }

    return Object.keys(tempDict);
}

function simpleReplace(word: string) {
    replaceName(word, new RegExp(word));
}

const commonBanks = [
    "STANDARD CHARTERED",
    "TRAVELEX",
    "WESTPAC",
    "CITIBANK",
    "CITIGROUP",
    "BBVA",
    "FIRSTCARIBBEAN",
    "CHASE",
    "ALPHA",
    "JILA SAHAKARI KENDRIYA BANK MARYADIT",
    "KARNATAKA",
    "KOTAK MAHINDRA",
    "JSC",
    "SEB",
    "DANSKE",
    "BARCLAYS",
    "MCB",
    "CAPITAL ONE",
];

for (let b of commonBanks) {
    simpleReplace(b);
}

replaceName("BBVA", /BANCO BILBAO VIZCAYA ARGENTARIA/);

console.log("Before: ", input.length);
console.log("After: ", joinSimilar().length);

fs.writeFileSync("./out.json", JSON.stringify(joinSimilar(), null, 4));

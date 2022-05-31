import fs from "fs";

const c = (str: string) => {
    const re = /\d{6}/g;
    return ((str || "").match(re) || []).length;
};

let out: {
    [key: string]: { bankName: string; country: string };
} = {};

let o: {
    bankName: string;
    bins: string[];
    country: string;
}[] = JSON.parse(fs.readFileSync("./out.json").toString());

let count = 0;
let max = c(fs.readFileSync("./out.json").toString());

for (let bank of o) {
    for (let bin of bank.bins) {
        console.clear();
        console.log(++count, "of", max);
        if (/^[34567]\d{5}$/.test(bin)) {
            out[bin] = {
                bankName: bank.bankName,
                country: bank.country,
            };
        }
    }
}

fs.writeFileSync("./binlist.json", JSON.stringify(out, null, 4));

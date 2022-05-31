import * as cheerio from "cheerio";
import fs from "fs";

interface IBank {
    bankName: string;
    bins: string[];
    country: string;
}

const binRegex = /\d{6}/;
const countRegex =
    /Total Card issuers in this country found in our database \((\d+)\)/;

let binCounter = 0;

let totalCountries = 0;
let initCountries = 0;

async function getCountry(url: string): Promise<IBank[]> {
    initCountries++;
    const country = url.trim().toUpperCase().slice(-2);
    let text = await (await fetch(url)).text();
    let max;
    const $ = cheerio.load(text);
    let a1 = $.text().match(countRegex);
    let a = parseInt(a1![1]);

    if (a % 50 == 0) {
        max = a / 50;
    } else {
        max = a / 50 + 1;
    }

    let allUrls: string[] = [];
    for (let page = 1; page < max; page++) {
        let urls = await getBanks(`${url}?page=${page}`);
        allUrls = [...allUrls, ...urls];
    }
    let c = 0;
    let output: IBank[] = [];
    for (let url of allUrls) {
        console.clear();
        console.log(
            "Currently doing",
            country,
            "url: ",
            ++c,
            "/",
            allUrls.length,
            "\n\nTotal bins: ",
            binCounter,
            "\n\nCountries done: ",
            initCountries,
            "/",
            totalCountries
        );
        let out: IBank = {
            bankName: url.split("/").slice(-1)[0].replace("-", " "),
            bins: await getBins(url),
            country: country,
        };
        output.push(out);
    }

    fs.writeFileSync(
        `./output/${country}.json`,
        JSON.stringify(output, null, 4)
    );

    return output;
}

async function getBins(input: string) {
    let out: string[] = [];
    let x = await fetch(input);
    const $ = cheerio.load(await x.text());
    let max = 1;
    $(".page-link").each((i, e) => {
        let a = parseInt($(e).text());
        if (!Number.isNaN(a) && a > max) {
            max = a;
        }
    });
    for (let page = 1; page < max + 1; page++) {
        let x = await fetch(`${input}?page=${page}`);
        const $ = cheerio.load(await x.text());
        $("table tr").each((_, e) => {
            let t = $(e).text();
            if (binRegex.test(t)) {
                let a = t.match(binRegex)!;
                out.push(a[0]);
            }
        });
    }
    binCounter += out.length;
    return out.sort();
}

async function getBanks(input: string) {
    let out: string[] = [];
    let x = await fetch(input);
    const $ = cheerio.load(await x.text());
    $("table tr td a").each((_, e) => {
        out.push(`https://bintable.com/${$(e).attr("href")!}`);
    });
    return out;
}

async function main() {
    let countries: string[] = [];
    let x = await fetch("https://bintable.com/issuers");
    const $ = cheerio.load(await x.text());
    $(".country-item a").each((_, e) => {
        countries.push("https://bintable.com/" + $(e).attr("href")!);
    });

    totalCountries = countries.length;

    let out: IBank[] = [];

    for (let c of countries) {
        out = out.concat(await getCountry(c));
    }

    fs.writeFileSync("./output.json", JSON.stringify(out, null, 4));
}

await main();

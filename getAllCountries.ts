import { load } from "cheerio"
import fs from "fs"

interface IBank {
  bankName: string
  bins: string[]
  country: string
}

// Hate Regex now, used to love it
const binRegex = /\d{6}/
const countRegex =
  /Total Card issuers in this country found in our database \((\d+)\)/

// setting counters for ui purposes
let binCounter = 0
let totalCountries = 0
let iCountries = 0

async function getCountry(url: string): Promise<IBank[]> {
  // increment current country counter
  iCountries++

  // this is where the urls of each country will be stored
  let allUrls: string[] = []
  // this is the counter for the country
  let country_i = 0
  // this is the output of each countries bins
  let output: IBank[] = []

  // get the country code from the link
  // e.g. https://bintable.com/issuers/af
  const country_code = url.trim().toUpperCase().slice(-2)

  // want it in text format to use cheerio
  let html_response = await (await fetch(url)).text()

  // load the html into cheerio
  const $ = load(html_response)
  // get the total number of banks in the country using the regex above
  let country_count = parseInt($.text().match(countRegex)![1])

  let pages_count = Math.ceil(country_count / 50)

  for (let page = 0; page < pages_count; page++) {
    let urls = await getBanks(`${url}?page=${page}`)
    // bad memory usage looking back at it
    allUrls = allUrls.concat(urls)
  }

  for (let url of allUrls) {
    // using clear is expensive and bad, should use carriage return and write over it
    console.clear()
    // backtick strings weren't a thing back then
    console.log(
      "Currently doing",
      country_code,
      "urls: ",
      allUrls.length,
      "\n\nTotal bins: ",
      binCounter,
      "\n\nCountries done: ",
      iCountries,
      "/",
      totalCountries
    )

    // create the object to be pushed to the output
    let out: IBank = {
      bankName: url.split("/").slice(-1)[0].replace("-", " "),
      bins: await getBins(url),
      country: country_code,
    }

    output.push(out)
  }

  // write the output to a file
  // should have used a in memory sqlite db
  fs.writeFileSync(
    `./output/${country_code}.json`,
    JSON.stringify(output, null, 4)
  )

  return output
}

async function getBins(input: string) {
  let out: string[] = []
  let max = 1

  // grabbing response again
  let resp = await fetch(input)
  const $ = load(await resp.text())

  // get the max page number
  $(".page-link").each((i, e) => {
    let a = parseInt($(e).text())
    if (!Number.isNaN(a) && a > max) {
      max = a
    }
  })

  for (let page = 1; page < max; page++) {
    // fetching each page of bins
    let x = await fetch(`${input}?page=${page}`)
    const $ = load(await x.text())

    // using each to iterate through each row of the bin table
    $("table tr").each((_, e) => {
      let t = $(e).text()
      // testing if the row has a bin
      // with regex :(
      if (binRegex.test(t)) {
        let a = t.match(binRegex)!
        out.push(a[0])
      }
    })
  }

  // adding it to the total bin counter
  binCounter += out.length
  return out.sort()
}

async function getBanks(input: string) {
  let out: string[] = []

  let x = await fetch(input)
  const $ = load(await x.text())

  $("table tr td a").each((_, e) => {
    out.push(`https://bintable.com/${$(e).attr("href")!}`)
  })

  return out
}

async function main() {
  let countries: string[] = []
  let out: IBank[] = []

  // get the list of countries
  let x = await fetch("https://bintable.com/issuers")
  const $ = load(await x.text())

  // get the links for each country
  $(".country-item a").each((_, e) => {
    countries.push("https://bintable.com/" + $(e).attr("href")!)
  })

  // set the total countries for the ui
  totalCountries = countries.length

  // iterate through each country
  // very slow...
  //   for (let c of countries) {
  //     out = out.concat(await getCountry(c))
  //   }

  // this is much better
  let promises = await Promise.all(countries.map(getCountry))

  // flattens it so it's not an array of arrays
  promises.flat()

  // slow writing again, and using sync... should use fs/promises
  fs.writeFileSync("./output.json", JSON.stringify(out, null, 4))
}

// calling async function
main().then(() => {})

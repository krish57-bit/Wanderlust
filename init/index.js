if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");

const DB_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust"; // fallback for dev

async function main() {
    try {
        await mongoose.connect(DB_URL);
        console.log("✅ Connected to DB");

        await Listing.deleteMany({});
        initdata.data = initdata.data.map(obj => ({
            ...obj,
            owner: "653cd6bda600917744ca7927" // Hardcoded owner ID
        }));

        await Listing.insertMany(initdata.data);
        console.log("🌱 Data was initialized");
        process.exit(); // Ensure the script exits after completion
    } catch (err) {
        console.error("❌ DB Init Error:", err);
        process.exit(1);
    }
}

main();

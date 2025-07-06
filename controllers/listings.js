const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// INDEX: Show all listings (optionally filtered by category)
module.exports.index = async (req, res) => {
    const { category } = req.query;
    let listings;

    if (category) {
        listings = await Listing.find({ category: new RegExp(`^${category}$`, 'i') });
    } else {
        listings = await Listing.find({});
    }

    // ✅ Match the name used in the EJS template
    res.render("listings/index", { allListings: listings });
};


// RENDER NEW FORM
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// SHOW ONE LISTING
module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" }
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing, mapToken }); // ✅ Pass mapToken here
};


// CREATE LISTING
module.exports.createListing = async (req, res, next) => {
    const response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    }).send();

    const url = req.file.path;
    const filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = response.body.features[0].geometry;

    await newListing.save();
    req.flash("success", "New Listing Created");
    res.redirect("/listings");
};

// RENDER EDIT FORM
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// UPDATE LISTING
module.exports.updateListing = async (req, res) => {
    const { id } = req.params;

    const coordinate = await geocodingClient.forwardGeocode({
        query: `${req.body.listing.location}, ${req.body.listing.country}`,
        limit: 1
    }).send();

    req.body.listing.geometry = coordinate.body.features[0].geometry;

    const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if (req.file) {
        const url = req.file.path;
        const filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
};

// DELETE LISTING
module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
};

// FILTER BY CATEGORY
module.exports.filterListings = async (req, res, next) => {
    const { q } = req.params;
    const filteredListings = await Listing.find({ category: q });

    if (!filteredListings.length) {
        req.flash("error", "No Listings exist for this filter!");
        return res.redirect("/listings");
    }

    res.locals.success = `Listings Filtered by ${q}`;
    res.render("listings/index.ejs", { allListings: filteredListings });
};

// SEARCH FUNCTION
module.exports.search = async (req, res) => {
    const raw = req.query.q?.trim().replace(/\s+/g, " ");
    if (!raw) {
        req.flash("error", "Search value empty!!!");
        return res.redirect("/listings");
    }

    let formatted = "";
    let flag = false;
    for (let i = 0; i < raw.length; i++) {
        formatted += (i === 0 || flag) ? raw[i].toUpperCase() : raw[i].toLowerCase();
        flag = raw[i] === " ";
    }

    let allListings = await Listing.find({
        title: { $regex: formatted, $options: "i" }
    });

    if (!allListings.length) {
        allListings = await Listing.find({ category: { $regex: formatted, $options: "i" } });
    }

    if (!allListings.length) {
        allListings = await Listing.find({ country: { $regex: formatted, $options: "i" } });
    }

    if (!allListings.length) {
        allListings = await Listing.find({ location: { $regex: formatted, $options: "i" } });
    }

    const intVal = parseInt(formatted, 10);
    if (!allListings.length && Number.isInteger(intVal)) {
        allListings = await Listing.find({ price: { $lte: intVal } }).sort({ price: 1 });
    }

    if (allListings.length) {
        res.locals.success = "Search Results";
        return res.render("listings/index.ejs", { allListings });
    }

    req.flash("error", "No listings found for the search!");
    res.redirect("/listings");
};

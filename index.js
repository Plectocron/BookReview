import express from "express";
import bodyParser from "body-parser";
import supabase from './db.js';

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function getBookRows() {
  try {
    const {data: books, error: booksError} = await supabase
      .from('books')
      .select('*');
    if (booksError) throw booksError;
    
    const {data: image_IDs, error: idsError} = await supabase
      .from('image_IDs')
      .select('*')
      .in('id', books.map(book => book.id));
    if (idsError) throw idsError;
    
    const {data: summaries, error: summariesError} = await supabase
      .from('book_summaries')
      .select('*')
      .in('id', books.map(book => book.id));
    if (summariesError) throw summariesError;

    const bookRows = books.map( book => {
      return {
        ...book,
        ids: image_IDs.filter(image_ID => image_ID.id === book.id),
        summaries: summaries.filter(summary => summary.id === book.id)
      }
    });

    return bookRows

  } catch(error) {
    console.error("Error caught:", JSON.stringify(error, null, 2));
    return [];
  }
}

async function getBook(id) {
  try {
    const books = await getBookRows();
    const book = books.find(book => book.id == id);
    return book
  } catch (error) {
    console.error("Error caught:", JSON.stringify(error, null, 2));
  }
}

app.get("/", async (req, res) => {
  try {
    const rows = await getBookRows();
    res.render("index.ejs", { rows: rows });
  } catch(error) {
    console.log(`Error caught: ${error}`);
    res.status(500).send(error);
  }
});

app.post("/notes", async(req, res) => {
  try {
    const book = await getBook(req.body["book-id"]);
    res.render("notes.ejs", { book: book })
  } catch(error) {
    console.log(`Error caught: ${error}`);
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});
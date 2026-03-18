import { useState } from "react";
import IsbnScanner from "./IsbnScanner";
import BookEntryForm from "./BookEntryForm";
import CopyGenerator from "./CopyGenerator";

const ScanAndAddBook = () => {
  const [isbn, setIsbn] = useState("");
  const [savedBook, setSavedBook] = useState<{ id: string; title: string } | null>(null);

  return (
    <div className="space-y-4">
      {!savedBook && (
        <>
          <IsbnScanner onScanned={(code) => setIsbn(code)} />
          <BookEntryForm isbn={isbn} onIsbnChange={setIsbn} onBookSaved={(id, title) => setSavedBook({ id, title })} />
        </>
      )}
      {savedBook && (
        <CopyGenerator bookId={savedBook.id} bookTitle={savedBook.title} onDone={() => setSavedBook(null)} />
      )}
    </div>
  );
};

export default ScanAndAddBook;

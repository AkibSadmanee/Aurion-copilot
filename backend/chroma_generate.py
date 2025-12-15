import chromadb
import re
import chromadb.errors

# 1. SETUP CLIENT
client = chromadb.PersistentClient(path="./chw_sentence_db")

# Try to delete, but ignore the error if it doesn't exist
try:
    client.delete_collection(name="chw_sentences")
except chromadb.errors.NotFoundError: # <--- CATCH THE CORRECT ERROR
    print("Collection didn't exist yet, creating new one...")
except ValueError:
    # Older versions of Chroma sometimes raised ValueError, keeping this for safety
    pass

collection = client.create_collection(name="chw_sentences")

# 2. HELPER FUNCTIONS

def clean_text(text):
    """Removes page markers and excessive whitespace."""
    # Remove lines like "--- PAGE 1 ---"
    text = re.sub(r'--- PAGE \d+ ---', '', text)
    # Remove citation tags if you don't want them e.g. (Optional)
    # text = re.sub(r'\[cite_.*?\]', '', text) 
    return text.strip()

def split_into_sentences(text):
    """
    Splits text into sentences using regex.
    Look for punctuation (.!?) followed by whitespace or end of string.
    """
    # This pattern looks for . ! ? followed by a space and an uppercase letter, or end of string.
    # It avoids splitting on common abbreviations like 'Dr.' or 'Mr.' is harder without NLTK, 
    # but this simple regex works well for structured text.
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if len(s) > 10]

def create_sliding_windows(sentences, window_size=3):
    """
    Groups sentences into overlapping chunks of size N.
    Stride of 1: [1,2,3], [2,3,4], [3,4,5]
    """
    windows = []
    if len(sentences) < window_size:
        # If section is too short, just take what we have
        return [" ".join(sentences)]
    
    for i in range(len(sentences) - window_size + 1):
        # Create a chunk of 3 sentences
        window = sentences[i : i + window_size]
        windows.append(" ".join(window))
    
    return windows

# 3. PROCESSING PIPELINE

# Assumption: You have the text saved in 'chw_guide.txt'
try:
    with open("chw_guide.txt", "r", encoding="utf-8") as f:
        full_text = f.read()
except FileNotFoundError:
    print("Please save your text to 'chw_guide.txt' first.")
    exit()

# Step A: Split by Chapter first so we can attach the Chapter Title to every sentence chunk
chapter_chunks = full_text.split("*** CHAPTER")

final_documents = []
final_metadatas = []
final_ids = []

global_counter = 0

for chunk in chapter_chunks:
    if len(chunk.strip()) < 10: 
        continue

    # Extract Title (First line)
    clean_chunk = clean_text(chunk)
    lines = clean_chunk.split('\n')
    # Usually the first non-empty line after splitting is the title or number
    chapter_title = lines[0].strip().replace(':', '').strip()
    
    # Step B: Get all sentences in this chapter
    # We join lines first to handle sentences that wrap across lines
    chapter_body = " ".join(lines)
    sentences = split_into_sentences(chapter_body)
    
    # Step C: Create 3-sentence windows
    windows = create_sliding_windows(sentences, window_size=3)
    
    for window in windows:
        final_documents.append(window)
        final_metadatas.append({
            "source": "CHW Guide",
            "chapter": chapter_title
        })
        final_ids.append(f"id_{global_counter}")
        global_counter += 1

print(f"Generated {len(final_documents)} chunks (3-sentence windows).")
print("Adding to ChromaDB...")

# 4. ADD TO CHROMA
# We process in batches to be safe, though Chroma handles large lists well now.
collection.add(
    documents=final_documents,
    metadatas=final_metadatas,
    ids=final_ids
)

print("Data added successfully!")
print("-" * 30)

# # 5. RETRIEVAL TEST
# query = "How should a CHW handle a client who is ambivalent about change?"

# print(f"Query: '{query}'\n")

# results = collection.query(
#     query_texts=[query],
#     n_results=3
# )

# for i, doc in enumerate(results['documents'][0]):
#     chapter_ref = results['metadatas'][0][i]['chapter']
#     print(f"--- Result {i+1} (from Chapter: {chapter_ref}) ---")
#     print(doc)
#     print("\n")

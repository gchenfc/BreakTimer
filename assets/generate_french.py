# Generates french words and translations using ChatGPT

# gpt-3.5-turbo-1106	

from openai import OpenAI
import json
import concurrent.futures

def get_from_chatGPT2():
    client = OpenAI()

    with open('1000_french_words_bank.txt', 'r') as f:
        words = f.read().split('\n')
        print(words)

    prompt = """For each of the following words, please provide the english translation and a sample sentence using the word.  Please follow this json format:"""
    prompt += "\n\n"
    prompt += """{
        "data":
            [
                {
                    "French": "Bonjour",
                    "English": "Hello",
                    "SampleSentence": "Bonjour! Comment ça va?"
                },
                {
                    "French": "Oui",
                    "English": "Yes",
                    "SampleSentence": "Oui, je veux bien."
                },
                {
                    "French": "Non",
                    "English": "No",
                    "SampleSentence": "Non, merci."
                },
                ...
            ]
        }
        """
    prompt += "\n\n"

    def process_chunk(chunk_index, words_chunk):
        words_prompt = ' '.join(words_chunk)

        stream = client.chat.completions.create(
            model="gpt-3.5-turbo-1106",
            messages=[{"role": "system", "content": prompt},
                      {"role": "user", "content": words_prompt}],
            response_format={"type": "json_object"},
            stream=True,
        )

        with open(f"/tmp/french_words_{chunk_index}.json", 'w') as f:
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    # print(chunk.choices[0].delta.content, end="")
                    f.write(chunk.choices[0].delta.content)

    # Split the 'words' array into chunks of 100 words each
    chunk_size = 100
    word_chunks = [words[i:i + chunk_size] for i in range(0, len(words), chunk_size)]

    # Process the chunks in parallel using ThreadPoolExecutor
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        for i, chunk in enumerate(word_chunks, 1):
            executor.submit(process_chunk, i, chunk)

    # At this point, all futures are completed
    # Combine files into one large file
    combined = []
    for i in range(1, len(word_chunks) + 1):
        chunk_filename = f"/tmp/french_words_{i}.json"
        with open(chunk_filename, 'r') as infile:
            data = json.load(infile)
            combined.extend(data['data'])
    output_filename = "french_words_alt.json"
    with open(output_filename, 'w') as outfile:
        json.dump(combined, outfile, indent=2)

    print(f"All chunks combined into {output_filename}")

get_from_chatGPT2()
exit()

def merge_json_files():
    files = ['french_words_1.json', 'french_words_2.json', 'french_words_3.json', 'french_words_4.json']
    all_data = []
    for fname in files:
        with open(fname) as infile:
            data = json.load(infile)
            if isinstance(data, list):
                all_data.extend(data)
            else:
                all_data.extend(data['data'])
    
    print(f'There are {len(all_data)} words in the final list.')
    unique = set([obj['French'] for obj in all_data])
    print(f'There are {len(unique)} unique words in the final list.')

    with open('french_words.json', 'w') as outfile:
        json.dump(all_data, outfile, indent=2)

def get_from_chatGPT():

    client = OpenAI()

    with open("french_words.json", 'r') as f:
        data = json.load(f)
        words_already_generated = set([obj['French'] for obj in data])

    if True:
        prompt = """Please generate 1000 commonly used french words for someone learning french for the first time, with english translations and sample sentences.  Also include some vocabulary related to yoga and strength training.  Please follow this json format:"""
        prompt += "\n\n"
        prompt += """{
        "data":
            [
                {
                    "French": "Bonjour",
                    "English": "Hello",
                    "SampleSentence": "Bonjour! Comment ça va?"
                },
                {
                    "French": "Oui",
                    "English": "Yes",
                    "SampleSentence": "Oui, je veux bien."
                },
                {
                    "French": "Non",
                    "English": "No",
                    "SampleSentence": "Non, merci."
                },
                ... 997 more words
            ]
        }
        """
        prompt += "\n\n"
        prompt += """Please do NOT include the following words because I already know what they mean:"""
        prompt += "\n\n"
        prompt += ' '.join(words_already_generated)

    print('prompt is: ', prompt)

    if input('Ok to proceed? (empty string for yes, anything else for no)'):
        exit()

    stream = client.chat.completions.create(
        model="gpt-3.5-turbo-1106",
        messages=[{"role": "user", "content": prompt}],
        response_format={ "type": "json_object" },
        stream=True,
    )

    with open("french_words_4.json", 'w') as f:
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                print(chunk.choices[0].delta.content, end="")
                f.write(chunk.choices[0].delta.content)

if __name__ == '__main__':
    get_from_chatGPT()
    merge_json_files()

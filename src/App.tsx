import {useEffect, useState} from "react";
import type {Schema} from "../amplify/data/resource";
import {generateClient} from "aws-amplify/data";

const client = generateClient<Schema>();

function App() {
    const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

    useEffect(() => {
        console.log(client.queries)

        client.queries.searchTodos().then(res => {
            console.log(res);
        })

        client.models.Todo.observeQuery().subscribe({
            next: (data) => setTodos([...data.items]),
        });
    }, []);

    const priorityArray = ["low", "medium", "high"];

    function createTodo() {
        client.models.Todo.create({
            content: window.prompt("Todo content"),
            done: Math.round(Math.random() * 10) % 2 == 0,
            priority: (priorityArray[Math.round(Math.random() * 10) % 3] as "low" | "medium" | "high")
        });
    }

    return (
        <main>
            <h1>My todos</h1>
            <button onClick={createTodo}>+ new</button>
            <ul>
                {todos.map((todo) => (
                    <li key={todo.id}>{`${todo.content} | ${todo.done} | ${todo.priority}`}</li>
                ))}
            </ul>
            <div>
                🥳 App successfully hosted. Try creating a new todo.
                <br/>
                <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
                    Review next step of this tutorial.
                </a>
            </div>
        </main>
    );
}

export default App;
